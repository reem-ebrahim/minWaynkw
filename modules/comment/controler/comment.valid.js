const Joi = require("joi");

module.exports.validationsddcomment = {
    body: Joi.object().required().keys({
        body: Joi.string().min(10).required(),
        post_id: Joi.string().min(24).max(24),
        comment_by: Joi.string().min(24).max(24)
    }), params: Joi.object().required().keys({
        id: Joi.string().min(24).max(24).required()
    })
}
module.exports.validationsreplycomment = {
    body: Joi.object().required().keys({
        body: Joi.string().min(10).required()
    }), query: Joi.object().required().keys({
        commentId: Joi.string().min(24).max(24).required()
    })
}
module.exports.validationsupdatecomment = {
    body: Joi.object().required().keys({
        body: Joi.string().min(10).required(),
        post_id: Joi.string().min(24).max(24),
        comment_by: Joi.string().min(24).max(24)
    }), params: Joi.object().required().keys({
        id: Joi.string().min(24).max(24).required(),
    })
}
module.exports.validationsdeletecomment = {
    params: Joi.object().required().keys({
        id: Joi.string().min(24).max(24).required(),
    })
}
module.exports.validationslikecomment = {
    params: Joi.object().required().keys({
        id: Joi.string().min(24).max(24).required(),
    })
}