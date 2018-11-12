const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');

class NunjucksBrunchPlugin {
    constructor(config) {
        this.brunchPlugin = true;
        this.type = 'template';
        this.extension = 'html';
        this.nunjucksOptions = {};
        this.publicPath = 'public';
        this.templatePath = 'app/views';
        this.projectPath = path.resolve(process.cwd());
        this.filePatterns = /^app(\/|\\)views(\/|\\).*.html$/;

        this.config = config;
        this.configure();
    }

    configure() {
        var options, ref, ref1, ref2;
        if (((ref = this.config.plugins) != null ? ref.nunjucks : void 0) != null) {
            options =
                ((ref1 = this.config) != null ? (ref2 = ref1.plugins) != null ? ref2.nunjucks : void 0 :
                    void 0) || this.config.plugins.nunjucks;
        } else {
            options = {};
        }
        if (options.filePatterns != null) {
            this.filePatterns = options.filePatterns;
        }
        if (options.templatePath != null) {
            this.templatePath = options.templatePath;
        }
        if (options.path != null) {
            this.publicPath = options.path;
        }
        return this.nunjucksOptions = _.omit(options, 'filePatterns', 'path');
    }

    templateFactory(templatePath, options, callback) {
        var e, env, error, template;
        try {
            env = new nunjucks.Environment(new nunjucks.FileSystemLoader(path.dirname(templatePath)));
            template = env.render(options.filename, options);
        } catch (error1) {
            e = error1;
            error = e;
        }
        return callback(error, template);
    }

    compile(data, originalPath, callback) {
        var options, relativePath, successHandler, templatePath;
        // I am avoiding the use of the data variable. Using the file path
        // lets the template compile correctly when referencing other templates.
        templatePath = path.resolve(originalPath);
        relativePath = path.relative(this.projectPath, templatePath);
        options = _.extend({}, this.nunjucksOptions);
        if (options.filename == null) {
            options.filename = path.basename(relativePath);
        }
        successHandler = (error, template) => {
            var outputDirectory, outputPath, publicPath;
            if (error != null) {
                callback(error);
                return;
            }
            if (relativePath.length) {
                publicPath = path.join(this.projectPath, this.publicPath);
                outputPath = relativePath.replace(this.templatePath, '');
                outputPath = path.join(publicPath, outputPath);
                outputDirectory = path.dirname(outputPath);
                // TODO: Save this block from an eternity in callback hell.
                return mkdirp(outputDirectory, function (err) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        return fs.writeFile(outputPath, template, function (err, written, buffer) {
                            if (err) {
                                return callback(err, null);
                            } else {
                                return callback();
                            }
                        });
                    }
                });
            } else {
                return callback(null, `module.exports = ${template};`);
            }
        };
        return this.templateFactory(templatePath, options, successHandler);
    }
}

module.exports = NunjucksBrunchPlugin;
