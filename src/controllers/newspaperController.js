import Newspaper from '../models/Newspaper.js';
import crypto from 'crypto';

export const getNewspapers = async (req, res) => {
  try {
    const newspapers = await Newspaper.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: newspapers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createNewspaper = async (req, res) => {
  try {
    const linkId = crypto.randomBytes(4).toString('hex');
    const newspaper = new Newspaper({ ...req.body, linkId });
    const createdNewspaper = await newspaper.save();
    res.status(201).json({ success: true, data: createdNewspaper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getNewspaperById = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (newspaper) {
      res.json({ success: true, data: newspaper });
    } else {
      res.status(404).json({ success: false, message: 'Newspaper not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateNewspaper = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (newspaper) {
      Object.assign(newspaper, req.body);
      const updatedNewspaper = await newspaper.save();
      res.json({ success: true, data: updatedNewspaper });
    } else {
      res.status(404).json({ success: false, message: 'Newspaper not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNewspaper = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (newspaper) {
      await newspaper.deleteOne();
      res.json({ success: true, message: 'Newspaper removed' });
    } else {
      res.status(404).json({ success: false, message: 'Newspaper not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const newspaper = await Newspaper.findById(req.params.id);
    if (newspaper) {
      newspaper.status = newspaper.status === 'published' ? 'draft' : 'published';
      const updatedNewspaper = await newspaper.save();
      res.json({ success: true, data: updatedNewspaper });
    } else {
      res.status(404).json({ success: false, message: 'Newspaper not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
