/*
* GET home page.
*/
var crypto = require('crypto'),
    fs = require('fs'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js');
module.exports = function (app) {
    app.get('/', function (req, res) {
        Post.getAll(null, function (err, p_latest) {
            if (err) {
                p_latest = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: p_latest,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        if (password != password_re) {
            req.flash('error', '两次输入的密码不一致!');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password,
            email: req.body.email
        });

        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', '用户已存在!');
                return res.redirect('/reg');
            }
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功!');
                res.redirect('/');
            });
        });
    });
    app.get('/manage', checkNotLogin);
    app.get('/manage', function (req, res) {
        res.render('manage', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            errorAccount: req.flash('errorAccount').toString(),
            errorPassword: req.flash('errorPassword').toString()
        });
    });
    app.get('/manage', checkNotLogin);
    app.post('/manage', function (req, res) {
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
            if (!user) {
                req.flash('errorAccount', '*用户名不存在!');
                return res.redirect('/manage');
            }
            if (user.password != password) {
                req.flash('errorPassword', '*密码错误!');
                return res.redirect('/manage');
            }
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');
        });
    });
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            post = new Post(currentUser.name, req.body.title, req.body.post, req.body.desc, req.body.type);
        post.save(function (err) {
            if (err) {
                req.flash("error", err);
                return res.redirect("/");
            }
            req.flash("success", "发布成功!");
            res.redirect("/");
        });
    });
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect("/");
    });
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        if (req.files.file1.size == 0) {
            fs.unlinkSync(req.files.file1.path);
            console.log('Successfully removed an empty file!');
        }
        else {
            console.log(req.files.file1.name);
            var target_path = './upload/img/' + req.files.file1.name;
            fs.renameSync(req.files.file1.path, target_path);
            console.log('Successfully renamed a file!');
        }
        req.flash('success', '文件上传成功!');
        res.redirect('/upload');
    });

    app.get('/work', function (req, res) {
        Post.getAll(null, function (err, p_latest) {
            if (err) {
                p_latest = [];
            }
            res.render('index', {
                title: '主页',
                user: req.session.user,
                posts: p_latest,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get("/u/:name", function (req, res) {
        User.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash("error", "用户不存在!");
                return res.redirect("/");
            }

            Post.getAll(user.name, function (err, posts) {
                if (err) {
                    req.flash("error", err);
                    return res.redirect("/");
                }
                res.render("user", {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash("success").toString(),
                    error: req.flash("error").toString()
                });
            });
        });
    });
    app.get("/u/:name/:day/:title", function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash("error", err);
                return res.redirect("/");
            }
            res.render("article", {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash("success").toString(),
                error: req.flash("error").toString()
            });
        });
    });

    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
             date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功!');
            res.redirect('back');
        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/edit/:name/:day/:title', checkLogin);
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = '/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title;
            if (err) {
                req.flash('error', err);
                return res.redirect(url); //出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect(url); //成功！返回文章页
        });
    });

    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
        });
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登陆!');
            res.redirect('back');
        }
        next();
    }
}