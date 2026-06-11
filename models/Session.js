const mongoose = require('mongoose');

const inputSchema = new mongoose.Schema({
  id:    { type: String },
  label: { type: String },
  value: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionName:    { type: String, default: '' },
  sourceFile:     { type: String, default: 'Manual Entry' },   // filename if from Excel
  uploadedAt:     { type: Date,   default: Date.now },

  // raw inputs captured from the form / Excel
  inputs: [inputSchema],

  // computed results
  results: {
    BoilerEff:     Number,
    BoilerEffCorr: Number,
    Ldg:  Number,
    Luc:  Number,
    Lmf:  Number,
    Lhf:  Number,
    Lco:  Number,
    Lma:  Number,
    Lrad: Number,
    CO2in:  Number,
    CO2out: Number,
    Trai:   Number,
    AL:     Number,
    Tgc:    Number,
    Ldgc:   Number,
    Lucc:   Number,
    Lmfc:   Number,
    Lhfc:   Number,
    Lcoc:   Number,
    Lmac:   Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
