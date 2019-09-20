const addDays = require('date-fns/addDays');

class IssuesFilterPool {
  constructor(period, filters) {
    this.filters = filters;
    this.date = addDays(new Date(), Number(`-${period}`)).toISOString();
  }

  filter(issues) {
    return issues.map(issue => {
      this.filters.forEach(filter => {issue = filter(issue, this.date)});
      return issue;
    });
  }

}

module.exports = IssuesFilterPool;