module.exports = {
  beforeUpdate(event) {
    const data = event.params.data
    if (data.publishedAt && !data.publishedDateTime) {
      data.publishedDateTime = data.publishedAt
    }
  },
}
