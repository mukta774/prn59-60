/**
 * Mongoose Models for Vaccine Hesitancy System
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// ============= USER MODEL =============
const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  role: {
    type: String,
    enum: ['individual', 'doctor', 'institution', 'admin'],
    default: 'individual'
  },
  verified: { type: Boolean, default: false },
  profile: {
    name: String,
    phone: String,
    institution: String,
    nmc_registration: String,
    institution_type: String // For institutions: "hospital", "ngo", "government"
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login: Date,
  is_active: { type: Boolean, default: true }
}, { _id: false });

// ============= SURVEY MODEL =============
const surveySchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  responses: {
    demographics: {
      age: String,
      gender: String,
      education: String,
      employment: String,
      location: String
    },
    prior_experience: {
      vaccination_history: String,
      side_effects_experienced: String,
      trusted_sources: [String]
    },
    attitudes: {
      confidence_approval: Number,
      worry_ingredients: Number,
      trust_doctors: Number,
      peer_influence: Number,
      media_influence: Number
    }
  },
  metadata: {
    timestamp: { type: Date, default: Date.now },
    device: { type: String, enum: ['mobile', 'desktop', 'tablet'] },
    language: { type: String, default: 'en' },
    session_id: String,
    ip_address: String
  },
  validation: {
    passed: { type: Boolean, default: true },
    flags: [String],
    risk_score: { type: Number, min: 0, max: 1, default: 0 }
  },
  created_at: { type: Date, default: Date.now }
}, { _id: false });

// ============= RESULTS MODEL =============
const resultsSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  survey_id: { type: String, required: true },
  hesitancy_score: { type: Number, required: true, min: 0, max: 100 },
  tier: {
    type: String,
    enum: ['Confident', 'Mildly Hesitant', 'Moderately Hesitant', 'Strongly Hesitant'],
    required: true
  },
  shap_factors: [{
    factor: String,
    influence_percentage: Number,
    explanation: String
  }],
  recommended_myths: [String], // References to myth IDs
  validation_flags: [String],
  contribute_anonymised: { type: Boolean, default: false },
  result_timestamp: { type: Date, default: Date.now },
  viewed_at: Date
}, { _id: false });

// ============= MYTHS MODEL =============
const mythSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  doctor_id: { type: String, required: true },
  concern: { type: String, required: true },
  myth: String, // The myth/concern being addressed
  response: { type: String, required: true },
  sources: [{
    type: { type: String, enum: ['pubmed', 'who', 'institutional', 'other'] },
    link: String,
    title: String,
    accessed_at: Date
  }],
  supporting_docs: [String], // File IDs/URLs
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'approved', 'rejected', 'revision_requested', 'published'],
    default: 'draft'
  },
  created_at: { type: Date, default: Date.now },
  submitted_at: Date,
  reviewed_by: String, // Admin user ID
  review_notes: String,
  published_at: Date,
  last_confirmed_at: Date,
  view_count: { type: Number, default: 0 },
  rating_avg: { type: Number, min: 0, max: 5 }
}, { _id: false });

// ============= INSTITUTIONS MODEL =============
const institutionSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  admin_id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['hospital', 'ngo', 'government', 'research', 'other'] },
  contact_email: { type: String, required: true },
  contact_phone: String,
  address: String,
  country: { type: String, default: 'India' },
  purpose: String,
  documents: [String], // Proof of registration, etc.
  verified: { type: Boolean, default: false },
  api_key: { type: String, unique: true },
  api_key_created: Date,
  created_at: { type: Date, default: Date.now },
  is_active: { type: Boolean, default: true }
}, { _id: false });

// ============= UPLOADS MODEL =============
const uploadSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  institution_id: { type: String, required: true },
  uploaded_by: String, // User ID
  filename: String,
  original_filename: String,
  file_path: String,
  upload_date: { type: Date, default: Date.now },
  row_count: Number,
  quality_score: Number,
  validation_results: {
    passed_rows: Number,
    flagged_rows: Number,
    errors: [String]
  },
  field_mapping: {}, // CSV column to system field mapping
  aggregated_results: {
    mean_score: Number,
    tier_distribution: {},
    factor_heatmap: [],
    regional_flags: [String]
  },
  export_history: [{
    export_date: Date,
    export_type: String,
    exported_by: String
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error_message: String,
  deleted_at: Date
}, { _id: false });

// ============= AUDIT LOGS MODEL =============
const auditLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  timestamp: { type: Date, default: Date.now },
  actor_id: String,
  actor_role: String,
  action: { type: String, required: true },
  resource_type: String,
  resource_id: String,
  old_value: mongoose.Schema.Types.Mixed,
  new_value: mongoose.Schema.Types.Mixed,
  ip_address: String,
  user_agent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  error_message: String
}, { _id: false });

// Create and export models
module.exports = {
  User: mongoose.model('User', userSchema),
  Survey: mongoose.model('Survey', surveySchema),
  Result: mongoose.model('Result', resultsSchema),
  Myth: mongoose.model('Myth', mythSchema),
  Institution: mongoose.model('Institution', institutionSchema),
  Upload: mongoose.model('Upload', uploadSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema)
};
