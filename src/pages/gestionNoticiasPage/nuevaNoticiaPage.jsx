
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button} from 'react-bootstrap';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
import { db } from '../../firebase';

const NuevaNoticiaPage = () => {
	const [titulo, setTitulo] = useState('');
	const [descripcion, setDescripcion] = useState('');
	const [tipo, setTipo] = useState('video'); 
	const [videoLink, setVideoLink] = useState('');
	const [pdfLink, setPdfLink] = useState('');
	const navigate = useNavigate();

	const resetForm = () => {
		setTitulo('');
		setDescripcion('');
		setTipo('video');
		setVideoLink('');
	};

	const isYouTube = (url) => {
		try {
			return /youtube\.com|youtu\.be/.test(url);
		} catch { return false; }
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!titulo.trim()) {
			Swal.fire({
				title:"Falta título", 
				text: "Por favor añade un título.", 
				icon: "error",
				background: '#052b27ff', 
				color: '#ffdfdfff', 
				confirmButtonColor: '#0b6860ff'
			});
			return;
		}

		if (tipo === 'video') {
			if (!videoLink.trim()) {
				Swal.fire({
					title:"Falta link", 
					text: "Por favor añade el enlace del video.", 
					icon: "error",
					background: '#052b27ff',
					color: '#ffdfdfff', 
					confirmButtonColor: '#0b6860ff'
				});
				return;
			}
		} else {
			if (!pdfLink.trim()) {
				Swal.fire({
					title:"Falta link", 
					text: "Por favor añade el enlace del pdf.", 
					icon: "error",
					background: '#052b27ff', 
					color: '#ffdfdfff', 
					confirmButtonColor: '#0b6860ff'
				});
				return;
			}
		}

		try {
			if (tipo === 'pdf') {
				// Guardar en Firestore
				await addDoc(collection(db, 'materialNoticias'), {
					nombre: titulo,
					descripcion: descripcion,
					tipo: 'pdf',
					url: pdfLink.trim(),
					fecha: serverTimestamp()
				});
				Swal.fire({
					title: "Guardado",
					text: `Material de Noticia guardado correctamente.`,
					icon: "success",
					background: '#052b27ff', 
					color: '#ffff'
				});
				resetForm();
				navigate('/gestionAdmin');
				
			} else {
				// Guardar video link 
				await addDoc(collection(db, 'materialNoticias'), {
					nombre: titulo,
					descripcion: descripcion,
					tipo: 'video',
					url: videoLink.trim(),
					fecha: serverTimestamp()
				});
				Swal.fire({
					title: "Guardado",
					text: `Video guardado correctamente.`,
					icon: "success",
					background: '#052b27ff',
					color: '#ffff'
				});
				resetForm();
				navigate('/gestionAdmin');
			}
		} catch (error) {
			console.error(error);
			Swal.fire({
				title:"Error", 
				text: "Ocurrió un error guardando el material.", 
				icon: "error",
				background: '#052b27ff', 
				color: '#ffdfdfff', 
				confirmButtonColor: '#0b6860ff'
			});
		}
	}

	const renderVideoPreview = () => {
		if (!videoLink) return null;
		if (isYouTube(videoLink)) {
			// Normalizar link 
			let embed = videoLink;
			if (videoLink.includes('watch?v=')) {
				embed = videoLink.replace('watch?v=', 'embed/');
			}
			embed = embed.replace('youtu.be/', 'www.youtube.com/embed/');
			return (
				<div className="ratio ratio-16x9 mb-3">
					<iframe src={embed} title="Preview video" allowFullScreen />
				</div>
			);
		}
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
			<div className='body-new-MEstudio bg-gradient2'>
				<main className="container container-new-MEstudio py-4">
					<h2>Noticia - Nueva</h2>
					<Form onSubmit={handleSubmit} className="mt-3">
						<Form.Group className="mb-3">
							<Form.Label>Título</Form.Label>
							<input type="text" spellCheck='true' className="form-control2" value={titulo} onChange={e => setTitulo(e.target.value)}/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Descripción</Form.Label>
								<textarea
									className="form-control2 textarea-comentarios"
									spellCheck='true'
									rows={3}
									value={descripcion}
									onChange={e => setDescripcion(e.target.value)} 
								></textarea>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Tipo</Form.Label>
							<div>
								<Form.Check inline label="Video " name="tipo" type="radio" id="tipo-video" checked={tipo === 'video'} onChange={() => setTipo('video')} />
								<Form.Check inline label="PDF " name="tipo" type="radio" id="tipo-pdf" checked={tipo === 'pdf'} onChange={() => setTipo('pdf')} />
							</div>
						</Form.Group>

						{tipo === 'video' && (
							<>
								<Form.Group className="mb-3">
									<Form.Label>Enlace del video</Form.Label>
									<input type="text" className="form-control2" value={videoLink} onChange={e => setVideoLink(e.target.value)} placeholder="https://..."/>
								</Form.Group>
								{renderVideoPreview()}
							</>
						)}

						{tipo === 'pdf' && (
							<>
								<Form.Group className="mb-3">
									<Form.Label>Enlace del PDF</Form.Label>
									<input type="text" className="form-control2" value={pdfLink} onChange={e => setPdfLink(e.target.value)}/>
								</Form.Group>
							</>
						)}
						<div className="d-flex gap-2">
							<Button type="submit" className='btn-success' >Guardar</Button>
							<Button className='cancelar-btn' onClick={() => navigate('/gestionAdmin')}>Cancelar</Button>
						</div>
					</Form>
				</main>
			</div>
			<Footer />
		</>
	);
};

export default NuevaNoticiaPage;