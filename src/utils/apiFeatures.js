class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    ['page', 'sort', 'limit', 'fields', 'search'].forEach((f) => delete queryObj[f]);
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (m) => `$${m}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(fields = ['title', 'description']) {
    if (this.queryString.search) {
      const regex = new RegExp(this.queryString.search, 'i');
      this.query = this.query.find({ $or: fields.map((f) => ({ [f]: regex })) });
    }
    return this;
  }

  sort() {
    const sortBy = this.queryString.sort
      ? this.queryString.sort.split(',').join(' ')
      : '-createdAt';
    this.query = this.query.sort(sortBy);
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      this.query = this.query.select(this.queryString.fields.split(',').join(' '));
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    this._page = Math.max(1, parseInt(this.queryString.page, 10) || 1);
    this._limit = Math.min(100, parseInt(this.queryString.limit, 10) || 20);
    this.query = this.query.skip((this._page - 1) * this._limit).limit(this._limit);
    return this;
  }
}

module.exports = APIFeatures;
