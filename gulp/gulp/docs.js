let project = 'build'
let source = 'src'
let node = 'node_modules'

let path = {
	src: {
		html: source + '/*.html',
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

// HTML
const fileInclude = require('gulp-file-include')
const htmlclean = require('gulp-htmlclean')
const webpHTML = require('gulp-webp-html')

// SASS
const sass = require('gulp-sass')(require('sass'))
const sassGlob = require('gulp-sass-glob')
const autoprefixer = require('gulp-autoprefixer')
const csso = require('gulp-csso')
const webpCss = require('gulp-webp-css')
const bs = require('browser-sync').create()
const clean = require('gulp-clean')
const fs = require('fs')
const sourceMaps = require('gulp-sourcemaps')
const groupMedia = require('gulp-group-css-media-queries')
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')
const babel = require('gulp-babel')
const changed = require('gulp-changed')
const imagemin = require('gulp-imagemin')
const webp = require('gulp-webp')

const svgSprite = require('gulp-svg-sprite')
const svgMinify = require('gulp-svgmin')
const cheerio = require('gulp-cheerio')
const replace = require('gulp-replace')

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

const autoprefixerSettings = {
	grid: true,
	overrideBrowserslist: ['last 10 version'],
	cascade: false,
	browsers: [
		'Android >= 4',
		'Chrome >= 20',
		'Firefox >= 24',
		'Explorer >= 11',
		'iOS >= 6',
		'Opera >= 12',
		'Safari >= 6',
	],
}

// const imageminSettings = [
// 	imagemin.gifsicle({ interlaced: true }),
// 	imagemin.mozjpeg({ quality: 75, progressive: true }),
// 	imagemin.optipng({ optimizationLevel: 5 }),
// 	imagemin.svgo({
// 		plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
// 	}),
// ]


const svgMinifyConfig = {
	multipass: true,
	js2svg: {
		pretty: true,
		indent: 2,
	},
}

const cheerioConfig = {
	run: function ($) {
		$('[fill]').removeAttr('fill')
		$('[stroke]').removeAttr('stroke')
		$('[style]').removeAttr('style')
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

gulp.task('html:docs', function () {
	return gulp
		.src(path.src.html)
		.pipe(changed(path.build.html, { hasChanged: changed.compareContents }))
		.pipe(plumber(plumberNotify('HTML')))
		.pipe(fileInclude(fileIncludeSetting))
		.pipe(webpHTML())
		.pipe(htmlclean())
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({ stream: true }))
})

gulp.task('sass:docs', function () {
	return gulp
		.src(path.src.scss)
		.pipe(changed(path.build.css))
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sourceMaps.init())
		.pipe(groupMedia())
		.pipe(sassGlob())
		.pipe(webpCss())
		.pipe(sass())
		.pipe(autoprefixer(autoprefixerSettings))
		.pipe(csso())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest(path.build.css))
		.pipe(reload({ stream: true }))
})

gulp.task('js:docs', function () {
	return gulp
		.src(path.src.js)
		.pipe(changed(path.build.js))
		.pipe(plumber(plumberNotify('JS')))
		.pipe(babel())
		.pipe(webpack(require('../webpack.config.js')))
		.pipe(gulp.dest(path.build.js))
		.pipe(reload({ stream: true }))
})

gulp.task('images:docs', function () {
	return gulp
		.src(path.src.img)
		.pipe(changed(path.build.img))
		.pipe(webp())
		.pipe(gulp.dest(path.build.img))
		.pipe(gulp.src(path.src.img))
		.pipe(changed(path.build.img))
		.pipe(imagemin({ verbose: true }))
		.pipe(gulp.dest(path.build.img))
		.pipe(reload({ stream: true }))
})

gulp.task('svg:docs', function () {
	return gulp
		.src(path.src.svg)
		.pipe(svgMinify(svgMinifyConfig))
		.pipe(cheerio(cheerioConfig))
		.pipe(replace('&gt;', '>'))
		.pipe(svgSprite(svgSpriteConfig))
		.pipe(gulp.dest(path.build.svg))
})

gulp.task('fonts:docs', function () {
	return gulp
		.src(path.src.font)
		.pipe(changed(path.build.font))
		.pipe(gulp.dest(path.build.font))
		.pipe(reload({ stream: true }))
})

gulp.task('files:docs', function () {
	return gulp
		.src(path.src.files)
		.pipe(changed(path.build.files))
		.pipe(gulp.dest(path.build.files))
		.pipe(reload({ stream: true }))
})

gulp.task('server:docs', function () {
	bs.init({
		server: {
			baseDir: path.root,
		},
		watch: true,
		notify: false,
		open: true,
	})
})

gulp.task('clean:docs', function (done) {
	if (fs.existsSync(path.root)) {
		return gulp.src(path.root, { read: false }).pipe(clean({ force: true }))
	}
	done()
})
