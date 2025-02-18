import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import { graphql } from 'babel-plugin-relay/macro';
import React, { useState } from 'react';
import { commitMutation, createFragmentContainer } from 'react-relay';
import environment from '../../createRelayEnvironment';
import { RepositorySettings_repository } from './__generated__/RepositorySettings_repository.graphql';
import {
  RepositorySettingsMutationResponse,
  RepositorySettingsMutationVariables,
} from './__generated__/RepositorySettingsMutation.graphql';
import {
  Checkbox,
  IconButton,
  Input,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
} from '@mui/material';
import { AddCircle } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';

const saveSettingsMutation = graphql`
  mutation RepositorySettingsMutation($input: RepositorySettingsInput!) {
    saveSettings(input: $input) {
      settings {
        needsApproval
        decryptEnvironmentVariables
        configResolutionStrategy
        additionalEnvironment
        cacheVersion
      }
    }
  }
`;

interface Props {
  repository: RepositorySettings_repository;
}

function RepositorySettings(props: Props) {
  let [initialSettings, setInitialSettings] = useState(props.repository.settings);
  let [settings, setSettings] = useState(props.repository.settings);
  let [additionalEnvironmentToAdd, setAdditionalEnvironmentToAdd] = useState('');

  let changeField = field => {
    return event => {
      let value = event.target.value;
      setSettings({
        ...settings,
        [field]: value,
      });
    };
  };

  let setClearCaches = (event, checked) => {
    const cacheVersion = checked ? initialSettings.cacheVersion + 1 : initialSettings.cacheVersion;

    setSettings({
      ...settings,
      cacheVersion: cacheVersion,
    });
  };

  let toggleField = field => {
    return event => {
      setSettings({
        ...settings,
        [field]: !settings[field],
      });
    };
  };

  let addNewEnvVariable = () => {
    setAdditionalEnvironmentToAdd('');
    setSettings({
      ...settings,
      additionalEnvironment: (settings.additionalEnvironment || []).concat(additionalEnvironmentToAdd),
    });
  };

  let deleteEnv = line => {
    setSettings({
      ...settings,
      additionalEnvironment: (settings.additionalEnvironment || []).filter(value => line !== value),
    });
  };

  function onSave() {
    const variables: RepositorySettingsMutationVariables = {
      input: {
        clientMutationId: 'save-settings-' + props.repository.id,
        repositoryId: props.repository.id,
        needsApproval: settings.needsApproval,
        decryptEnvironmentVariables: settings.decryptEnvironmentVariables,
        configResolutionStrategy: settings.configResolutionStrategy,
        additionalEnvironment: settings.additionalEnvironment.concat(),
        cacheVersion: settings.cacheVersion,
      },
    };

    commitMutation(environment, {
      mutation: saveSettingsMutation,
      variables: variables,
      onCompleted: (response: RepositorySettingsMutationResponse) => {
        setInitialSettings(response.saveSettings.settings);
      },
      onError: err => console.error(err),
    });
  }

  let areSettingsTheSame =
    settings.needsApproval === initialSettings.needsApproval &&
    settings.configResolutionStrategy === initialSettings.configResolutionStrategy &&
    JSON.stringify(settings.additionalEnvironment) === JSON.stringify(initialSettings.additionalEnvironment) &&
    settings.decryptEnvironmentVariables === initialSettings.decryptEnvironmentVariables &&
    settings.cacheVersion === initialSettings.cacheVersion;
  return (
    <Card elevation={24}>
      <CardContent>
        <FormControl style={{ width: '100%' }}>
          <FormControlLabel
            control={<Switch checked={settings.needsApproval} onChange={toggleField('needsApproval')} />}
            label="Require approval for builds from users without write permissions"
          />
        </FormControl>
        <FormControl style={{ width: '100%' }}>
          <FormHelperText>Decrypt Secured Environment Variables for builds initialized by:</FormHelperText>
          <Select
            value={settings.decryptEnvironmentVariables}
            onChange={changeField('decryptEnvironmentVariables')}
            style={{ width: '100%' }}
          >
            <MenuItem value={'EVERYONE'}>Everyone</MenuItem>
            <MenuItem value={'USERS_WITH_WRITE_PERMISSIONS'}>Only users with write permissions</MenuItem>
          </Select>
        </FormControl>
        <FormControl style={{ width: '100%' }}>
          <FormHelperText>Config resolution strategy:</FormHelperText>
          <Select
            value={settings.configResolutionStrategy}
            onChange={changeField('configResolutionStrategy')}
            style={{ width: '100%' }}
          >
            <MenuItem value={'SAME_SHA'}>Same SHA</MenuItem>
            <MenuItem value={'MERGE_FOR_PRS'}>Merge for PRs</MenuItem>
            <MenuItem value={'DEFAULT_BRANCH'}>Latest from default branch</MenuItem>
          </Select>
        </FormControl>
        <FormControl style={{ width: '100%' }}>
          <FormHelperText>Environment variable overrides</FormHelperText>
          <List>
            {settings.additionalEnvironment.map(line => (
              <ListItem key={line}>
                <ListItemText primary={line} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" aria-label="delete" onClick={() => deleteEnv(line)} size="large">
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </FormControl>
        <FormControl style={{ width: '100%' }}>
          <InputLabel htmlFor="override-env-var">
            New Environment Variable Override (FOO=Bar or FOO=ENCRYPTED[...])
          </InputLabel>
          <Input
            id="override-env-var"
            value={additionalEnvironmentToAdd}
            onChange={event => setAdditionalEnvironmentToAdd(event.target.value)}
            endAdornment={
              <InputAdornment position="end">
                <IconButton aria-label="add new env variable override" onClick={addNewEnvVariable} size="large">
                  <AddCircle />
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
        <FormControl style={{ width: '100%' }}>
          <FormControlLabel
            control={
              <Checkbox checked={initialSettings.cacheVersion !== settings.cacheVersion} onChange={setClearCaches} />
            }
            label="Clear all repository caches"
          />
        </FormControl>
      </CardContent>
      <CardActions>
        <Button variant="contained" disabled={areSettingsTheSame} onClick={() => onSave()}>
          Save
        </Button>
      </CardActions>
    </Card>
  );
}

export default createFragmentContainer(RepositorySettings, {
  repository: graphql`
    fragment RepositorySettings_repository on Repository {
      id
      settings {
        needsApproval
        decryptEnvironmentVariables
        configResolutionStrategy
        additionalEnvironment
        cacheVersion
      }
    }
  `,
});
