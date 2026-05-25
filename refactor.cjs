const fs = require('fs');
const path = require('path');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
};

walk('/Users/deepakrana/Desktop/Term 6/INT222/LiForce2/src', (err, results) => {
  if (err) throw err;
  let count = 0;
  results.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace liforce_token checks with liforce_userId
    content = content.replace(/localStorage\.getItem\('liforce_token'\)/g, "localStorage.getItem('liforce_userId')");
    content = content.replace(/localStorage\.removeItem\('liforce_token'\)/g, "localStorage.removeItem('liforce_userId')");

    if (content !== original) {
      fs.writeFileSync(file, content);
      count++;
    }
  });
  console.log(`Replaced token logic in ${count} files.`);
});
