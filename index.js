const IssuesRepository = require('./IssuesRepository');
const IssuesFilters = require('./IssuesFilters');
const IssuesFilterPool = require('./IssuesFilterPool');
const createScheduler = require('probot-scheduler');
const fs = require('fs');

module.exports = app => {
  createScheduler(app, {
    delay: false,
    interval: 60 * 60 * 1000
  })

  app.on('schedule.repository', async context => {
    const repository = context.payload.repository.name;
    const organization = context.payload.repository.owner.login;
    const issuesRepository = new IssuesRepository(organization, repository);
    const issuesFilters = new IssuesFilters();
    const issuesFilterPool = new IssuesFilterPool(process.env.ALLOWED_UNACTIVE_PERIOD_DAYS, [
      issuesFilters.filterAssignedBefore,
      issuesFilters.filterLabeledByUserFrom,
      issuesFilters.filterCommentsByUserFrom,
      issuesFilters.filterReferencesByUserFrom
    ]);

    const issues = await issuesRepository.getList();
    const data = issuesFilters.filterIssuesWithoutAssignee(issuesFilterPool.filter(issues));

    data.forEach(issue => {
      issue.assignees.forEach(user => {
        user.resultInfo = `
    Labels: ${user.labels.length},
    Comments: ${user.comments.length},
    References: ${user.references.length}
  `;



        if (!user.labels.length && !user.comments.length && !user.references.length) {
           app.log.info(
             `Unasigned user ${user.login} from issue ${organization}/${repository}/${issue.number}
                User Activity:
                ${user.resultInfo}
           `);

          /*context.github.issues.removeAssignees({
            owner: organization,
            repo: repository,
            number: issue.number,
            assignees: [user.login]
          })*/
        }
      });
    });
  });
}
