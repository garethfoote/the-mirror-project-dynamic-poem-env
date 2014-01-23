module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-nodemon');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            main : {
                options: {
                    port : 8000,
                    hostname : 'localhost',
                    keepalive: true
                }

            }
        },
        sass: {
            dev: {
                options: {
                    lineNumbers: 'true'
                },
                files: {
                    './public/css/main.css': './public/css/main.scss'
                }
            },
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    './public/dist/css/main.css': './css/main.scss'
                }
            }
        },
        nodemon: {
            dev: {
                script: 'web.js'
            }
        },
        watch: {
            sass: {
                files: './public/css/**/*.scss',
                tasks: ['sass:dev']
            }
        }

    });

    grunt.registerTask('default', ['watch']);

};
