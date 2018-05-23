function Promisify(func) {
  if (typeof func === 'function') {
    return (...args) => new Promise((resolve, reject) => {
      func(...args, async (err, result) => {
        if (err) reject(err);
        else {
          resolve(result);
        }
      });
    });
  }
  return new Error('Promisify was not passed a Function');
}

module.exports = Promisify;
