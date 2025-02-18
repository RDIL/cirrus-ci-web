import React from 'react';

import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Storage from '@mui/icons-material/Storage';
import { navigateHelper } from '../../utils/navigateHelper';
import { createFragmentContainer } from 'react-relay';
import { graphql } from 'babel-plugin-relay/macro';
import { RepositoryNameChip_repository } from './__generated__/RepositoryNameChip_repository.graphql';
import { WithStyles } from '@mui/styles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';
import { useNavigate } from 'react-router-dom';

const styles = theme =>
  createStyles({
    avatar: {
      backgroundColor: theme.palette.primary.main,
    },
    avatarIcon: {
      color: theme.palette.primary.contrastText,
    },
  });

interface Props extends WithStyles<typeof styles> {
  className?: string;
  fullName?: boolean;
  repository: RepositoryNameChip_repository;
}

function RepositoryNameChip(props: Props) {
  let navigate = useNavigate();
  let repository = props.repository;

  function handleRepositoryClick(event, repository) {
    navigateHelper(navigate, event, '/github/' + repository.owner + '/' + repository.name);
  }

  return (
    <Chip
      label={props.fullName ? `${repository.owner}/${repository.name}` : repository.name}
      avatar={
        <Avatar className={props.classes.avatar}>
          <Storage className={props.classes.avatarIcon} />
        </Avatar>
      }
      onClick={e => handleRepositoryClick(e, repository)}
      className={props.className}
    />
  );
}

export default createFragmentContainer(withStyles(styles)(RepositoryNameChip), {
  repository: graphql`
    fragment RepositoryNameChip_repository on Repository {
      owner
      name
    }
  `,
});
