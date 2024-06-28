const Mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new Mongoose.Schema(
	{
		fullname: {
			type: String,
			minlength: 1,
			required: [true, 'Invalid Name'],
		},
		email: {
			type: String,
			required: [true, 'User Must Have Email'],
			validate: [validator.isEmail, 'Please Provide Valid Email'],
		},
		password: {
			type: String,
			required: [true, 'Users Must Have Password'],
			select: false,
		},
		confirmpassword: {
			type: String,
			// required:[true,"Confirm Password Field is Empty"],
			validate: {
				validator: function (el) {
					return el === this.password;
				},
				message: 'Password mismatched',
			},
			select: false,
		},
		avatar: { type: String },
		status: { type: String },
		friendlist: [
			{
				type: Mongoose.Schema.Types.ObjectId,
				ref: 'Users',
			},
		],
		created_At: {
			type: Date,
			default: Date.now(),
			select: false,
		},
		active: {
			type: Boolean,
			default: true,
			select: false,
		},
		role: {
			type: String,
			enum: ['participant', 'admin', 'me'],
			default: 'participant',
			select: false,
		},
		verified:{
			type:Boolean,
			required:[true,"not verified not Assigned"],
			select:false,
			default:false,
		},
		passwordChangedAt: {
			type: Date,
			select: false,
		},
		passswordResetToken: {
			type: String,
			select: false,
		},
		passwordResetExpires: {
			type: Date,
			Select: false,
		},
	},
	{
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);
userSchema.virtual('InstitutionDetails', {
	ref: 'institutionschema',
	foreignField: 'user',
	localField: '_id',
});
userSchema.virtual('ownMeetings', {
	ref: 'meetings',
	foreignField: 'createdBy',
	localField: '_id',
});

userSchema.methods.correctPassword = async (candidatePassword, password) => {
	try {
		return await bcrypt.compare(candidatePassword, password);
	} catch (error) {
		throw new Error(error);
	}
};
userSchema.methods.resetPassword = function () {
	const reset = crypto.randomBytes(32).toString('hex');
	this.passwordChangedAt = Date.now();
	this.passswordResetToken = crypto
		.createHash('sha256')
		.update(reset)
		.digest('hex');
	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
	return reset;
};
// userSchema.methods.createResetToken=function(){
//     const resetToken=crypto.randomBytes(12).toString('hex');
//     this.resetToken=crypto.createHash('sha256').update(resetToken).digest('hex');
//     this.resetTokenCreatedAt=Date.now();
//     return resetToken;

// }
userSchema.pre('save', async function (next) {
	if (this.isModified()) {
		return next();
	}

	(this.confirmpassword = ''),
		(this.password = await bcrypt.hash(this.password, 12));
	next();
});
// userSchema.methods.isModified = function () {
// 	return Boolean(this.passswordResetToken);
// };
userSchema.method("isModified",function () {
	return Boolean(this.passswordResetToken)},{suppressWarning:true});


const Users = Mongoose.model('Users', userSchema);

module.exports = Users;
