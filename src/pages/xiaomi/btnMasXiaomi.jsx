import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Form, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { auth, db } from '../../firebase';
import './xiaomi.css';
import NavBar from '../components/NavBarPage';
import Footer from '../components/FooterPage';
// Importación de Iconos e Imágenes
import IconoBuscar from '../../assets/Iconos/iconoLupa.png';
import IconoPantallaV from '../../assets/Iconos/iconoPantallaVerde.png';
import IconoPantallaR from '../../assets/Iconos/iconoPantallaRojo.png';
import IconoBateriaR from '../../assets/Iconos/IconoBateriaR3.png';
import IconoBateriaV from '../../assets/Iconos/IconoBateriaV.png';
import IconoFlexBotonesV from '../../assets/Iconos/flexBotonesV.png';
import IconoFlexBotonesR from '../../assets/Iconos/flexBotonesR.png';
import IconoPiezaA from '../../assets/Iconos/IconoPiezaA.png';
import IconologoXiami from '../../assets/logos/logoxiaomiverde2.png';


function BtnMasXiaomi() {
    const navigate = useNavigate();






}

export default BtnMasXiaomi;