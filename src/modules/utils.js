function removeFromArray(array, item) {
  var index = array.indexOf(item)
  if (index !== -1) array.splice(index, 1)
  return index
}

module.exports = {
  removeFromArray: removeFromArray
}
