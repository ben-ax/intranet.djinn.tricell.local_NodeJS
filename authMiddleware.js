module.exports = function (req, res, next) {
    if (req.session && req.session.loggedin) {
        return next();
    }
    return res.redirect('/api/login');
};
