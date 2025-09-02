import cloudinary from '../config/cloudinary.js';

// Handler to upload a single facility image
// Accepts either multipart is not used; expects JSON body with { image: base64DataURL }
export async function uploadFacilityImageHandler(req, res) {
  try {
    const { image } = req.body || {};
    if (!image) {
      return res.status(400).json({ error: 'Missing image payload' });
    }

    const uploadResult = await cloudinary.uploader.upload(image, {
      folder: 'pickleball/facilities',
      resource_type: 'image',
      transformation: [{ width: 1600, height: 1200, crop: 'limit' }]
    });

    return res.status(200).json({ url: uploadResult.secure_url, public_id: uploadResult.public_id });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}


