# 📱 App-Daptable: Sistema de Compatibilidad de Repuestos

## 📝 Descripción del Proyecto

App-Daptable es una **herramienta web de consulta rápida** diseñada para técnicos y tiendas de reparación. Su objetivo principal es **agilizar el proceso de identificación y compatibilidad de repuestos** (pantallas, baterías, puertos de carga, etc.) entre diferentes modelos y marcas de dispositivos móviles Android.

Utiliza una arquitectura de **doble registro en Firebase Firestore** para mantener un historial detallado por usuario y, simultáneamente, generar estadísticas globales de uso.

---

## 🛠️ Tecnologías y Dependencias

| Categoría | Tecnología | Notas |
| :--- | :--- | :--- |
| **Frontend** | React, React Router DOM | Librería principal de UI y navegación. |
| **Estilos/UI** | React Bootstrap, CSS | Estilos y componentes pre-diseñados. |
| **Base de Datos** | Firebase Firestore | Almacenamiento NoSQL en tiempo real. |
| **Autenticación**| Firebase Auth, `react-firebase-hooks` | Gestión de usuarios. |
| **Notificaciones**| `sweetalert2` | Alertas modales personalizadas. |

---

## 🚀 Guía de Instalación Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu máquina local.

### Prerrequisitos

Asegúrate de tener instalado:
* [Node.js](https://nodejs.org/): Versión 16 o superior.
* npm o yarn.

### 1. Clonar el Repositorio

```bash
git clone [URL_DE_TU_REPOSITORIO]
cd app-daptable
```
### 2. Instalar Dependencias
```bash
npm install
# o
yarn install
```
### 3. 🌐 Despliegue y Gestión con Firebase
```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```
---
## Version del proyecto
1.0

---
## Integrantes
Anderson Vega

Ruben Carrillo