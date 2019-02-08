const logger = require('debug')('nunjucks-brunch');
const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const _ = require('lodash');

class NunjucksBrunchPlugin {
    constructor(config) {
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

        this.templatesRoot = path.resolve(this.projectPath, this.templatePath);

        this.beforeRender = options.beforeRender || Function.prototype;

        return this.nunjucksOptions = _.omit(options, 'filePatterns', 'path', 'beforeRender');
    }

    templateFactory(templatePath, options, callback) {
        let nunjucksEnv = nunjucks.configure(this.templatesRoot);

        this.beforeRender(nunjucksEnv, templatePath);

        nunjucksEnv.render(options.filename, options, callback);
    }

    compile(data, originalPath, callback) {
        const templatePath = path.resolve(originalPath);
        const relativePath = path.relative(this.templatesRoot, templatePath);
        const options = _.extend({}, this.nunjucksOptions);
        if (options.filename == null) {
            options.filename = relativePath;
        }
        const successHandler = (error, template) => {
            let outputDirectory, outputPath, publicPath;

            if (template === null) {
                console.log(originalPath);
            }

            if (error != null) {
                logger(error);
                callback(error);
                return;
            }
            if (relativePath.length) {
                publicPath = path.join(this.projectPath, this.publicPath);
                outputPath = relativePath.replace(this.templatePath, '').replace('njk', 'html');
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
                return callback(null, `module.exports = ${ template };`);
            }
        };
        return this.templateFactory(templatePath, options, successHandler);
    }
}

NunjucksBrunchPlugin.prototype.brunchPlugin = true;
NunjucksBrunchPlugin.prototype.type = 'template';
NunjucksBrunchPlugin.prototype.extension = 'njk';
NunjucksBrunchPlugin.prototype.nunjucksOptions = { throwOnUndefined: true };
NunjucksBrunchPlugin.prototype.publicPath = 'public';
NunjucksBrunchPlugin.prototype.templatePath = 'app/views';
NunjucksBrunchPlugin.prototype.projectPath = path.resolve(process.cwd());
NunjucksBrunchPlugin.prototype.filePatterns = /^app(\/|\\)views(\/|\\).*.(html|njk)$/;

module.exports = NunjucksBrunchPlugin;
