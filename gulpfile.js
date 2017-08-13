/*=========================================
 GULP
 =========================================*/
var $ = require('gulp-load-plugins')({
    rename: {'gulp': 'g'},
    pattern: ['gulp', 'gulp-*', 'gulp.*', '@*/gulp{-,.}*']
});

var swallowError = function (error) {
    console.log(error.toString());
    this.emit('end');
};

// Browsers to target when prefixing CSS.
var BROWSERS = ['last 2 versions', 'ie >= 9'];

/*-----------------------------------------
 STYLES
 -----------------------------------------*/
$.g.task('styles', function () {
    $.g.src(['scss/*.scss','!scss/_*.scss'])
        .pipe($.sass()).on('error', $.sass.logError)
        .pipe($.autoprefixer({browsers: BROWSERS}))
        .pipe($.g.dest('css/'))
        .pipe($.notify('Styles compiled'));
});

/*-----------------------------------------
 WATCH, DEFAULT
 -----------------------------------------*/
$.g.task('watch', function () {
    $.g.watch('scss/**/*.scss', ['styles']);
});

$.g.task('default', ['styles', 'watch']);
