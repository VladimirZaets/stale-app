const {graphql} = require('@octokit/graphql');

class IssuesRepository {
  constructor (organization, repository) {
    this.organization = organization;
    this.repository = repository;
  }

  async getList() {
    let data = [];
    let cursor = null;
    let query = `query getIssues($organization: String!, $repository: String!, $cursor: String) {   
      repository(owner: $organization, name: $repository) {
        issues(states: OPEN, first: 40, after: $cursor filterBy: {
          assignee: "*"
        }) {
         edges {
          cursor
         }
         nodes {
          timelineItems(first: 100) {
            nodes {
              __typename
              ... on IssueComment {
                  publishedAt
                  author {
                    login
                  }
              }
              ... on LabeledEvent {
                  createdAt
                  label {
                    name
                    id
                  }
                  actor {
                    login
                  }
              }
              ... on AssignedEvent {
                    createdAt
                    assignee {          
                      ... on User {
                      login
                    }
                },
              }
              ... on CrossReferencedEvent {
                referencedAt
                actor {
                  login
                }
                source {
                  __typename
                  ...on PullRequest {
                    title
                    state
                  }
                }
              }
            }
          }
          number,
          id
          assignees(first: 100) {
            nodes {
              name,
              login
            }
          }
        } 
        }
      }
    }`;

    do {
      const res = await graphql(query, {
        organization: this.organization,
        repository: this.repository,
        cursor: cursor,
        headers: {
          authorization: `token ${process.env.GITHUB_USER_TOKEN}`
        }
      });

      data = [...data, ...res.repository.issues.nodes];
      cursor = res.repository.issues.edges.length ?
        res.repository.issues.edges[res.repository.issues.edges.length - 1].cursor : null;

    } while (cursor !== null);

    return this.normalizeData(data);
  }

  getAssignedEvents(data) {
    return data.filter(item => item.__typename === "AssignedEvent")
      .sort((first, second) => (new Date(second.createdAt)).getTime() - (new Date(first.createdAt)).getTime());
  }

  getLabeledEvents(data) {
    return data.filter(item => item.__typename === "LabeledEvent");
  }

  getIssueCommentEvents(data) {
    return data.filter(item => item.__typename === "IssueComment");
  }

  getCrossReferencedEvent(data) {
    return data.filter(item => item.__typename === "CrossReferencedEvent");
  }

  filterAssignedToUser(assigned, login) {
    const lastAssignee = assigned.find(elem => elem.assignee.login === login);

    return lastAssignee ? lastAssignee.createdAt : null;
  }

  filterLabeledByUser(labels, login) {
    return labels.filter(elem => elem.actor && elem.actor.login === login).map(element => ({
      labeledAt: element.createdAt,
      id: element.label.id,
      name: element.label.name
    }));
  }

  filterCommentedByUser(comments, login) {
    return comments.filter(elem => (elem.author && (elem.author.login === login))).map(element => ({
      commentedAt: element.publishedAt
    }));
  }

  filterReferencedByUser(references, login) {
    return references.filter(elem => elem.actor && elem.actor.login === login).map(element => ({
      type: element.source.__typename,
      title: element.source.title,
      state: element.source.state,
      referencedAt: element.referencedAt
    }));
  }

  normalizeData(data) {
    return data.map(item => {
      item.assignees = item.assignees.nodes.map(node => ({
        login: node.login,
        assignedAt: this.filterAssignedToUser(this.getAssignedEvents(item.timelineItems.nodes), node.login),
        labels: this.filterLabeledByUser(this.getLabeledEvents(item.timelineItems.nodes), node.login),
        comments: this.filterCommentedByUser(this.getIssueCommentEvents(item.timelineItems.nodes), node.login),
        references: this.filterReferencedByUser(this.getCrossReferencedEvent(item.timelineItems.nodes), node.login)
      }));

      return {
        title: item.title,
        number: item.number,
        id: item.id,
        assignees: item.assignees
      }
    });
  }
}

module.exports = IssuesRepository;
