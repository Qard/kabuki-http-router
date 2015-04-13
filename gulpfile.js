require('babel/register')({
  blacklist: ['regenerator']
})
var gulp = require('gulp')
var babel = require('gulp-babel')
var mocha = require('gulp-mocha')

gulp.task('default', [
  'watch'
])

gulp.task('build', function () {
  return gulp.src('lib/**/*.js')
    .pipe(babel({
      blacklist: ['regenerator']
    }))
    .pipe(gulp.dest('dist'))
})

gulp.task('test', ['build'], function () {
  require('should')
  return gulp.src('test/**/*.js', {
    read: false
  })
  .pipe(mocha({
    reporter: 'spec',
    timeout: 5000
  }))
  .once('error', function (e) {
    console.error(e.message)
  })
})

gulp.task('watch', function () {
  gulp.watch('lib/**/*.js', [
    'build'
  ])

  gulp.watch([
    'dist/**/*.js',
    'test/**/*.js'
  ], [
    'test'
  ])
})
