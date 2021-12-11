const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

function DB() {}

const self = DB.prototype;

// Cache
const CacheSchema = new Schema({
  _id: String,
  data: Schema.Types.Mixed,
}, {
  collection: 'cache',
  strict: false,
  timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'},
});

DB.prototype.Cache = mongoose.model('Cache', CacheSchema);

module.exports = new DB();