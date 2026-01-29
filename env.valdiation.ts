import * as Joi from 'joi';

export const validationSchema = Joi.object({
  MONGO_URL: Joi.string().uri().required(),
  PORT: Joi.number().default(3000),
  JWT_SECRET: Joi.string().required(),
  SMSCOUNTRY_AUTHKEY: Joi.string().required(),
  SMSCOUNTRY_AUTHTOKEN: Joi.string().required(),
  SMSCOUNTRY_SENDERID: Joi.string().required(),
  NODE_ENV: Joi.string().required(),
  AWS_S3_ACCESS_KEY: Joi.string().required(),
  AWS_S3_SECRET_KEY: Joi.string().required(),
  AWS_S3_REGION: Joi.string().required(),
  AWS_S3_BUCKET: Joi.string().required(),
});
