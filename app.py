import os
import time
import requests
import base64
from flask import Flask, request, jsonify, render_template_string, send_file
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import io
import hashlib
import json
from datetime import datetime

load_dotenv()

app = Flask(__name__)
CORS(app)

# Get API key from environment
REIMAGINEHOME_API_KEY = os.getenv('REIMAGINEHOME_API_KEY')

# Store uploaded images and results in memory
UPLOADED_IMAGES = {}
STAGING_RESULTS = {}

print(f"ReimagineHome API configured: {'Yes' if REIMAGINEHOME_API_KEY else 'No'}")

# HTML template
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>AI Room Stager</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div class="min-h-screen bg-gray-100 p-8">
        <h1 class="text-4xl font-bold text-center mb-2">AI Room Stager</h1>
        <p class="text-center text-gray-600 mb-8">Professional Virtual Staging with AI</p>
        
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <div class="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
                <p class="text-sm font-semibold mb-2">✨ Stage Your Room with AI</p>
                <p class="text-sm">Upload a photo of your empty room and watch AI transform it!</p>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-medium mb-2">Upload Your Room Photo</label>
                <input type="file" id="fileInput" accept="image/*" class="w-full p-2 border rounded">
                <img id="preview" class="mt-4 max-h-64 mx-auto hidden rounded shadow">
                <div id="uploadStatus" class="mt-2"></div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Room Type</label>
                    <select id="spaceType" class="w-full p-3 border rounded">
                        <option value="ST-INT-011">Living Room</option>
                        <option value="ST-INT-003">Bedroom</option>
                        <option value="ST-INT-009">Kitchen</option>
                        <option value="ST-INT-002">Bathroom</option>
                        <option value="ST-INT-004">Dining Room</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Design Style</label>
                    <select id="designTheme" class="w-full p-3 border rounded">
                        <option value="">AI Decides</option>
                        <option value="DT-INT-011">Modern</option>
                        <option value="DT-INT-003">Contemporary</option>
                        <option value="DT-INT-013">Scandinavian</option>
                        <option value="DT-INT-010">Minimal</option>
                    </select>
                </div>
            </div>
            
            <button id="stageBtn" class="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 font-semibold">
                Stage My Room
            </button>
            
            <div id="status" class="mt-4"></div>
            <div id="results" class="mt-6"></div>
            
            <!-- Results Section -->
            <div id="stagedResults" class="mt-8 hidden">
                <h3 class="text-lg font-semibold mb-4">Your Staged Room</h3>
                <div id="resultImages" class="grid grid-cols-1 gap-4"></div>
            </div>
        </div>
    </div>
    
    <script>
        let imageId = null;
        let currentJobId = null;
        
        document.getElementById('fileInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    document.getElementById('preview').src = event.target.result;
                    document.getElementById('preview').classList.remove('hidden');
                    
                    const uploadStatus = document.getElementById('uploadStatus');
                    uploadStatus.innerHTML = '<p class="text-sm text-blue-600">Uploading image...</p>';
                    
                    try {
                        const response = await fetch('/upload-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image: event.target.result })
                        });
                        
                        const data = await response.json();
                        if (data.success) {
                            imageId = data.image_id;
                            uploadStatus.innerHTML = '<p class="text-sm text-green-600">✓ Image uploaded!</p>';
                        } else {
                            uploadStatus.innerHTML = '<p class="text-sm text-red-600">Upload failed</p>';
                        }
                    } catch (error) {
                        uploadStatus.innerHTML = '<p class="text-sm text-red-600">Upload error</p>';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById('stageBtn').addEventListener('click', async () => {
            const btn = document.getElementById('stageBtn');
            const status = document.getElementById('status');
            const results = document.getElementById('results');
            
            if (!imageId) {
                alert('Please upload a room photo first');
                return;
            }
            
            const spaceType = document.getElementById('spaceType').value;
            const designTheme = document.getElementById('designTheme').value;
            
            btn.disabled = true;
            btn.textContent = 'Processing...';
            status.innerHTML = '<div class="text-blue-600">Submitting to AI...</div>';
            results.innerHTML = '';
            
            try {
                const response = await fetch('/api/stage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_id: imageId,
                        space_type: spaceType,
                        design_theme: designTheme
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentJobId = data.job_id;
                    status.innerHTML = `
                        <div class="bg-green-50 p-4 rounded">
                            <p class="text-green-800 font-semibold">✓ Staging job submitted!</p>
                            <p class="text-sm text-green-600 mt-1">Job ID: ${data.job_id}</p>
                        </div>
                    `;
                    
                    results.innerHTML = `
                        <div class="bg-blue-50 p-4 rounded">
                            <p class="font-semibold mb-2">AI is staging your room...</p>
                            <p class="text-sm text-gray-700">This usually takes 20-40 seconds.</p>
                        </div>
                    `;
                    
                    // Start polling for results
                    pollForResults(currentJobId);
                } else {
                    status.innerHTML = `
                        <div class="bg-red-50 p-4 rounded">
                            <p class="text-red-800 font-semibold">✗ Error</p>
                            <p class="text-sm text-red-600 mt-1">${data.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                status.innerHTML = `<div class="bg-red-50 p-4 rounded"><p class="text-red-800">Error: ${error.message}</p></div>`;
            } finally {
                btn.disabled = false;
                btn.textContent = 'Stage My Room';
            }
        });
        
        // Poll for results
        async function pollForResults(jobId) {
            const maxAttempts = 30; // 60 seconds
            let attempts = 0;
            
            const interval = setInterval(async () => {
                attempts++;
                
                try {
                    const response = await fetch(`/check-result/${jobId}`);
                    const data = await response.json();
                    
                    if (data.found) {
                        clearInterval(interval);
                        displayResults(data.result);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        document.getElementById('results').innerHTML = `
                            <div class="bg-yellow-50 p-4 rounded">
                                <p class="text-yellow-800">Still processing...</p>
                                <p class="text-sm text-yellow-600 mt-1">Large images may take longer. Check back in a moment.</p>
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Poll error:', error);
                }
            }, 2000);
        }
        
        function displayResults(result) {
            document.getElementById('results').innerHTML = `
                <div class="bg-green-50 p-4 rounded">
                    <p class="text-green-800 font-semibold">🎉 Staging complete!</p>
                </div>
            `;
            
            const stagedResults = document.getElementById('stagedResults');
            const resultImages = document.getElementById('resultImages');
            
            stagedResults.classList.remove('hidden');
            resultImages.innerHTML = '';
            
            if (result.output_urls && result.output_urls.length > 0) {
                result.output_urls.forEach((url, index) => {
                    resultImages.innerHTML += `
                        <div>
                            <img src="${url}" class="w-full rounded shadow" alt="Staged room">
                            <a href="${url}" target="_blank" class="text-sm text-blue-600 hover:underline mt-2 inline-block">
                                View full size
                            </a>
                        </div>
                    `;
                });
            }
        }
    </script>
</body>
</html>
'''

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload-image', methods=['POST'])
def upload_image():
    data = request.json
    image_data = data.get('image')
    
    if not image_data:
        return jsonify({'success': False, 'error': 'No image provided'})
    
    image_id = hashlib.md5(image_data.encode()).hexdigest()[:12]
    UPLOADED_IMAGES[image_id] = image_data
    
    return jsonify({'success': True, 'image_id': image_id})

@app.route('/image/<image_id>')
def serve_image(image_id):
    if image_id not in UPLOADED_IMAGES:
        return 'Image not found', 404
    
    image_data = UPLOADED_IMAGES[image_id]
    base64_data = image_data.split(',')[1] if ',' in image_data else image_data
    image_bytes = base64.b64decode(base64_data)
    
    return send_file(
        io.BytesIO(image_bytes),
        mimetype='image/jpeg',
        as_attachment=False,
        download_name=f'{image_id}.jpg'
    )

@app.route('/webhook/reimaginehome', methods=['POST'])
def webhook():
    """Receive results from ReimagineHome"""
    data = request.json
    
    if data and 'job_id' in data:
        job_id = data['job_id']
        STAGING_RESULTS[job_id] = {
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
    
    return jsonify({'status': 'success'})

@app.route('/check-result/<job_id>')
def check_result(job_id):
    """Check if we have received results for a job"""
    if job_id in STAGING_RESULTS:
        return jsonify({
            'found': True,
            'result': STAGING_RESULTS[job_id]['data']
        })
    return jsonify({'found': False})

@app.route('/api/stage', methods=['POST'])
def stage():
    data = request.json
    image_id = data.get('image_id')
    space_type = data.get('space_type')
    design_theme = data.get('design_theme')
    
    if not all([image_id, space_type]):
        return jsonify({'success': False, 'error': 'Missing required fields'})
    
    # Get the app's base URL (will be Render URL in production)
    base_url = request.url_root.rstrip('/')
    image_url = f"{base_url}/image/{image_id}"
    webhook_url = f"{base_url}/webhook/reimaginehome"
    
    headers = {'api-key': REIMAGINEHOME_API_KEY}
    
    try:
        # Step 1: Create masks
        mask_response = requests.post(
            'https://api.reimaginehome.ai/v1/create_mask',
            headers=headers,
            json={'image_url': image_url}
        )
        
        if mask_response.status_code != 200:
            return jsonify({
                'success': False,
                'error': 'Failed to process image. Please try again.'
            })
        
        mask_job_id = mask_response.json()['data']['job_id']
        
        # Step 2: Wait for masks
        masks = None
        for i in range(20):
            time.sleep(2)
            status_response = requests.get(
                f'https://api.reimaginehome.ai/v1/create_mask/{mask_job_id}',
                headers=headers
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                if status_data.get('data', {}).get('job_status') == 'done':
                    masks = status_data['data']['masks']
                    break
        
        if not masks:
            return jsonify({'success': False, 'error': 'Processing timeout'})
        
        # Step 3: Generate staged image
        furnishing_masks = [m['url'] for m in masks if 'furnishing' in m.get('category', '')]
        if not furnishing_masks:
            masks_sorted = sorted(masks, key=lambda x: x.get('area_percent', 0), reverse=True)
            mask_urls = [masks_sorted[0]['url']] if masks_sorted else []
        else:
            mask_urls = furnishing_masks
        
        generation_payload = {
            'image_url': image_url,
            'mask_urls': mask_urls,
            'mask_category': 'furnishing',
            'space_type': space_type,
            'generation_count': 1,
            'webhook_url': webhook_url
        }
        
        if design_theme:
            generation_payload['design_theme'] = design_theme
            
        gen_response = requests.post(
            'https://api.reimaginehome.ai/v1/generate_image',
            headers=headers,
            json=generation_payload
        )
        
        if gen_response.status_code == 200:
            result = gen_response.json()
            job_id = result.get('data', {}).get('job_id', 'processing')
            
            return jsonify({
                'success': True,
                'job_id': job_id,
                'message': 'Staging in progress'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to start staging'
            })
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# For local development
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)