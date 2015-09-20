module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		concat: {
			dist: {
				src: [
					"src/lib_start.js",
					"src/ls.js",
					"src/http.js",
					"src/events.js",
					"src/utils.js",
					"src/dropboxwrapper.js",
					"src/googledrive.js",
					"src/lightserver.js",
					"src/filesremote.js",
					"src/collection.js",
					"src/lisy.js",
					"src/lib_end.js"
				],
				dest: "dist/<%= pkg.name %>.js"
			}
		},

		jsbeautifier: {
			files: ["dist/<%= pkg.name %>.js"]
		},

		uglify: {
			main: {
				files: {
					"dist/<%= pkg.name %>.min.js": ["dist/<%= pkg.name %>.js"]
				}
			}
		},

		usebanner: {
			main: {
				options: {
					banner:
					"/*!\n" +
					" * <%= pkg.name %> v<%= pkg.version %>\n" +
					" * Author: <%= pkg.author %>\n" +
					" * Date: <%= grunt.template.today('yyyy-mm-dd') %>\n" +
					" */\n"
					
				},
				files: {
					src: ["dist/<%= pkg.name %>.js"]
				}
			}
		}

		
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-jsbeautifier");
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-banner');
	
	grunt.registerTask("default", [
		"concat",
		"jsbeautifier",
		"uglify",
		"usebanner"
	]);

};
