
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, ProgressBar } from 'react-bootstrap';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { db } from '../../firebase';

const ContenidoAprendePage = () => {
	const [titulo, setTitulo] = useState('');
	const [descripcion, setDescripcion] = useState('');
	const [tipo, setTipo] = useState('video'); // 'video' o 'pdf'
	const [videoLink, setVideoLink] = useState('');
	const [file, setFile] = useState(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploading, setUploading] = useState(false);
	const navigate = useNavigate();

	const resetForm = () => {
		setTitulo('');
		setDescripcion('');
		setTipo('video');
		setVideoLink('');
		setFile(null);
		setUploadProgress(0);
		setUploading(false);
	};

	const handleFileChange = (e) => {
		const f = e.target.files && e.target.files[0];
		if (f) {
			setFile(f);
		}
	};

	const isYouTube = (url) => {
		try {
			return /youtube\.com|youtu\.be/.test(url);
		} catch { return false; }
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!titulo.trim()) {
			Swal.fire('Falta título', 'Por favor añade un título.', 'error');
			return;
		}

		if (tipo === 'video') {
			if (!videoLink.trim()) {
				Swal.fire('Falta link', 'Por favor añade el enlace del video.', 'error');
				return;
			}
		} else {
			if (!file) {
				Swal.fire('Falta archivo', 'Por favor selecciona un PDF.', 'error');
				return;
			}
			if (file.type !== 'application/pdf') {
				Swal.fire('Formato inválido', 'Solo se permiten archivos PDF.', 'error');
				return;
			}
		}

		try {
			if (tipo === 'pdf') {
				// Subir a Firebase Storage
				setUploading(true);
				const storage = getStorage();
				const timestamp = Date.now();
				const storagePath = `estudios/${timestamp}_${file.name}`;
				const storageRef = ref(storage, storagePath);
				const uploadTask = uploadBytesResumable(storageRef, file);

				uploadTask.on('state_changed', (snapshot) => {
					const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
					setUploadProgress(progress);
				}, (error) => {
					console.error('Upload error', error);
					setUploading(false);
					Swal.fire('Error', 'Error al subir el archivo.', 'error');
				}, async () => {
					const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
					// Guardar en Firestore
					await addDoc(collection(db, 'estudios'), {
						nombre: titulo,
						descripcion: descripcion,
						tipo: 'pdf',
						url: downloadURL,
						storagePath: storagePath,
						creadoEn: serverTimestamp()
					});
					setUploading(false);
					Swal.fire('Guardado', 'Material de estudio guardado correctamente.', 'success');
					resetForm();
					navigate('/gestionAdmin');
				});
			} else {
				// Guardar video link directamente
				await addDoc(collection(db, 'estudios'), {
					nombre: titulo,
					descripcion: descripcion,
					tipo: 'video',
					url: videoLink.trim(),
					creadoEn: serverTimestamp()
				});
				Swal.fire('Guardado', 'Video guardado correctamente.', 'success');
				resetForm();
				navigate('/gestionAdmin');
			}
		} catch (error) {
			console.error(error);
			Swal.fire('Error', 'Ocurrió un error guardando el material.', 'error');
			setUploading(false);
		}
	};

	const renderVideoPreview = () => {
		if (!videoLink) return null;
		if (isYouTube(videoLink)) {
			// Normalizar link para iframe embebido
			let embed = videoLink;
			if (videoLink.includes('watch?v=')) {
				embed = videoLink.replace('watch?v=', 'embed/');
			}
			// Cambios mínimos: si es youtu.be
			embed = embed.replace('youtu.be/', 'www.youtube.com/embed/');
			return (
				<div className="ratio ratio-16x9 mb-3">
					<iframe src={embed} title="Preview video" allowFullScreen />
				</div>
			);
		}
		// Para otros enlaces directos de video
		return (
			<video controls className="w-100 mb-3">
				<source src={videoLink} />
				Tu navegador no soporta la reproducción de video.
			</video>
		);
	};

	return (
		<>
			<NavBar />
			<main className="container py-4">
				<h2>M. Estudio - Nuevo</h2>
				<Form onSubmit={handleSubmit} className="mt-3">
					<Form.Group className="mb-3">
						<Form.Label>Título</Form.Label>
						<Form.Control value={titulo} onChange={e => setTitulo(e.target.value)} />
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Descripción</Form.Label>
						<Form.Control as="textarea" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Tipo</Form.Label>
						<div>
							<Form.Check inline label="Video (link)" name="tipo" type="radio" id="tipo-video" checked={tipo === 'video'} onChange={() => setTipo('video')} />
							<Form.Check inline label="PDF (subida)" name="tipo" type="radio" id="tipo-pdf" checked={tipo === 'pdf'} onChange={() => setTipo('pdf')} />
						</div>
					</Form.Group>

					{tipo === 'video' && (
						<>
							<Form.Group className="mb-3">
								<Form.Label>Enlace del video</Form.Label>
								<Form.Control placeholder="https://..." value={videoLink} onChange={e => setVideoLink(e.target.value)} />
							</Form.Group>
							{renderVideoPreview()}
						</>
					)}

					{tipo === 'pdf' && (
						<>
							<Form.Group className="mb-3">
								<Form.Label>Seleccionar PDF</Form.Label>
								<Form.Control type="file" accept="application/pdf" onChange={handleFileChange} />
							</Form.Group>
							{uploading && <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />}
						</>
					)}

					<div className="d-flex gap-2">
						<Button type="submit" disabled={uploading}>{uploading ? 'Subiendo...' : 'Guardar'}</Button>
						<Button variant="secondary" onClick={() => navigate('/gestionAdmin')}>Cancelar</Button>
					</div>
				</Form>
			</main>
			<Footer />
		</>
	);
};

export default ContenidoAprendePage;
