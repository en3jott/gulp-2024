let project = 'build'
let source = 'src'
let node = 'node_modules'
const plugins_style = []

let path = {
	src: {
		html: [source + '/*.html', '!' + source + '/_*.html'],
		scss: source + '/scss/*.scss',
		css: source + '/css/',
		js: source + '/js/*.js',
		img: source + '/images/**/*.+(png|jpg|jpeg|webp|gif)',
		svg: source + '/images/sprite/**/*.svg',
		font: source + '/font/**/*.*',
		files: source + '/files/**/*.*',
	},

	build: {
		html: project + '/',
		css: project + '/css/',
		js: project + '/js/',
		img: project + '/images/',
		svg: project + '/images/sprite/',
		font: project + '/font/',
		files: project + '/files/',
	},

	watch: {
		html: source + '/**/*.html',
		scss: source + '/scss/**/*.scss',
		js: source + '/js/**/*.js',
		img: source + '/images/**/*.+(png|jpg|jpeg|webp|gif)',
		svg: source + '/images/sprite/**/*.svg',
		font: source + '/font/**/*.*',
		files: project + '/files/**/*.*',
	},

	root: './' + project + '/',
}

const gulp = require('gulp')
const fileInclude = require('gulp-file-include')
const bs = require('browser-sync').create()
const sass = require('gulp-sass')(require('sass'))
const sassGlob = require('gulp-sass-glob')
const clean = require('gulp-clean')
const fs = require('fs')
const sourceMaps = require('gulp-sourcemaps')
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')
const babel = require('gulp-babel')
const imagemin = require('gulp-imagemin')
const concat = require('gulp-concat')
const chalk = require('chalk')
const svgSprite = require('gulp-svg-sprite')
const svgMinify = require('gulp-svgmin')
const cheerio = require('gulp-cheerio')
const replace = require('gulp-replace')
const changed = require('gulp-changed')
const webpackInclude = require('./../webpack.config.js')
const webpack = require('webpack-stream')
const reload = bs.reload

const fileIncludeSetting = {
	prefix: '@@',
	basepath: '@file',
}

const plumberNotify = title => {
	return {
		errorHadler: notify.onError({
			title: title,
			message: 'Error <%= error.message %>',
			sound: false,
		}),
	}
}

const svgMinifyConfig = {
    multipass: true,
    js2svg: {
    	pretty: true,
        indent: 2,
	}
}

const cheerioConfig = {
	run: function ($) {
		$('[fill]').removeAttr('fill');
		$('[stroke]').removeAttr('stroke');
		$('[style]').removeAttr('style');
	},
	parserOptions: {
		xmlMode: true,
	},
}

const svgSpriteConfig = {
	mode: {
		symbol: {
			sprite: '../sprite.svg',
		},
	},
}

const sassConfig = {
	outputStyle: 'compressed',
}

gulp.task('html:dev', function () {
	return gulp
		.src(path.src.html)
		.pipe(changed(path.build.html))
		.pipe(plumber(plumberNotify('HTML')))
		.pipe(fileInclude(fileIncludeSetting))
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({ stream: true }))
})

gulp.task('sass:dev', function () {
	return gulp
		.src(path.src.scss)
		.pipe(changed(path.build.css))
		.pipe(sourceMaps.init())
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sassGlob())
		.pipe(sass())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest(path.build.css))
		.pipe(reload({ stream: true }))
})

gulp.task('styleLib:dev', function(done) {
	if (plugins_style.length > 0) {
		return gulp
			.src(plugins_style)
			.pipe(sass(sassConfig)).on('error', sass.logError)
			.pipe(concat('libs.min.css'))
			.pipe(gulp.dest(path.build.css))
			.pipe(gulp.dest(path.src.css))
	} else {
		return done(console.log(chalk.redBright('No added CSS/SCSS plugins')))
	}
})

gulp.task('js:dev', function () {
	return gulp
		.src(path.src.js)
		.pipe(changed(path.build.js))
		.pipe(plumber(plumberNotify('JS')))
		.pipe(babel())
		.pipe(webpack(webpackInclude))
		.pipe(gulp.dest(path.build.js))
		.pipe(reload({ stream: true }))
})

gulp.task('images:dev', function () {
	return gulp
		.src(path.src.img)
		.pipe(changed(path.build.img))
		.pipe(imagemin({ verbose: true }))
		.pipe(gulp.dest(path.build.img))
		.pipe(reload({ stream: true }))
})

gulp.task('svg:dev', function () {
	return gulp
		.src(path.src.svg)
		.pipe(svgMinify(svgMinifyConfig))
		.pipe(cheerio(cheerioConfig))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite(svgSpriteConfig))
		.pipe(gulp.dest(path.build.svg))
})

gulp.task('fonts:dev', function () {
	return gulp
		.src(path.src.font)
		.pipe(changed(path.build.font))
		.pipe(gulp.dest(path.build.font))
		.pipe(reload({ stream: true }))
})

gulp.task('files:dev', function () {
	return gulp
		.src(path.src.files)
		.pipe(changed(path.src.files))
		.pipe(gulp.dest(path.build.files))
		.pipe(reload({ stream: true }))
})

gulp.task('server:dev', function (params) {
	bs.init({
		server: {
			baseDir: path.root,
		},
		watch: true,
		notify: false,
		open: true,
	})
})

gulp.task('clean:dev', function (done) {
	if (fs.existsSync(path.root)) {
		return gulp.src(path.root, { read: false }).pipe(clean({ force: true }))
	}
	done()
})

gulp.task('watch:dev', function () {
	gulp.watch(path.watch.html, gulp.parallel('html:dev'))
	gulp.watch(path.watch.scss, gulp.parallel('sass:dev'))
	gulp.watch(path.watch.js, gulp.parallel('js:dev'))
	gulp.watch(path.watch.img, gulp.parallel('images:dev'))
	gulp.watch(path.watch.svg, gulp.parallel('svg:dev'))
	gulp.watch(path.watch.font, gulp.parallel('fonts:dev'))
	gulp.watch(path.watch.files, gulp.parallel('files:dev'))
})
