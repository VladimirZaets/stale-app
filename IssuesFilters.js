const _includes = require('lodash/includes');

class IssuesFilters {
  filterAssignedBefore(issue, date) {
    issue.assignees = issue.assignees
      .filter(node => !!((new Date(node.assignedAt)).getTime() < (new Date(date)).getTime()));
    return issue;
  }

  filterUsersInWhiteList(issue, date, whiteList) {
    issue.assignees = issue.assignees.filter(node => !(_includes(whiteList, node.login)));
    return issue;
  }

  filterLabeledByUserFrom(issue, date) {
    issue.assignees = issue.assignees.map(node => {
      node.labels = node.labels
        .filter(labelData => !!((new Date(labelData.labeledAt)).getTime() > (new Date(date)).getTime()));
      return node;
    });
    return issue;
  }

  filterCommentsByUserFrom(issue, date) {
    issue.assignees = issue.assignees.map(node => {
      node.comments = node.comments
        .filter(commentData => !!((new Date(commentData.commentedAt)).getTime() > (new Date(date)).getTime()));

      return node;
    });
    return issue;
  }

  filterReferencesByUserFrom(issue, date) {
    issue.assignees = issue.assignees.map(node => {
      node.references = node.references
        .filter(commentData => {
          if (commentData.type === 'PullRequest' && commentData.state === 'OPEN') {
            return true;
          } else if (commentData.type === 'PullRequest' && commentData.state === 'CLOSED') {
            return false;
          }

          return !!((new Date(commentData.referencedAt)).getTime() > (new Date(date)).getTime())
        });
      return node;
    });
    return issue;
  }

  filterIssuesWithoutAssignee(issues) {
    return issues.filter(issue => issue.assignees.length);
  }
}

module.exports = IssuesFilters;