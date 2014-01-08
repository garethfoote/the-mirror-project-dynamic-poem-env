module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

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
        }
    });

    grunt.registerTask('default', ['connect']);

};
