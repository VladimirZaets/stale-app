const addDays = require('date-fns/addDays');

class IssuesFilterPool {
  constructor(period, filters, usersWhiteList) {
    this.filters = filters;
    this.usersWhiteList = usersWhiteList || [];
    this.date = addDays(new Date(), Number(`-${period}`)).toISOString();
  }

  filter(issues) {
    return issues.map(issue => {
      this.filters.forEach(filter => {issue = filter(issue, this.date, this.usersWhiteList)});
      return issue;
    });
  }

}

module.exports = IssuesFilterPool;