# Hubbies Web-App 🌐🎮🎬📚

## Description 📝

**Hubbies** is a customizable web application designed to help users create, organize, and manage sections dedicated to their hobbies and interests, such as movies, music, books, video games, sports, and more. The main goal is to provide an attractive and modern interface that allows users to:

- Organize and track their hobbies. 📋
- Keep a history or log of what they’ve consumed or done. 🕒
- Share these sections publicly or privately. 🔒📤
- Engage with others through comments on their sections. 💬

The application focuses on delivering a **clean, responsive design** that is easy to use and adapts to any device.

## Table of Contents 📑

1. [Examples](#examples)
2. [Features](#features)
3. [Installation](#installation)
4. [Technologies](#technologies)
5. [Useful Resources](#useful-resources)
6. [Authors](#authors)

## Examples 💡

Here are some sample use cases for **Hubbies**:

1. **Movies Section:** A user creates a section for tracking movies they've watched, rating them, and leaving reviews. The user can share this list publicly or keep it private.
2. **Books Section:** A user adds books they plan to read and tracks their progress. They can also share reviews and engage with others who have read the same books.
3. **Video Games Section:** The user logs games they’ve played, achievements they've unlocked, and can comment on others' game experiences.
4. **Sports Section:** A user tracks their sports activities, sets goals, and can view others' progress on shared sport goals.

## Features 🌟

- **Customizable Sections:** Users can create personalized sections for each of their hobbies.
- **Tracking & History:** Keep a log of the activities you've done, such as movies watched, books read, games played, etc.
- **Public and Private Sharing:** Sections can be shared publicly with the community or kept private for personal tracking.
- **Interactive Comments:** Users can comment on shared hobby sections, fostering community interaction.
- **Responsive Design:** The application works seamlessly on both desktop and mobile devices.
- **User-Friendly Interface:** Clean and simple design that ensures an intuitive user experience.

## Installation ⚙️

###  Prerequisites
- Node.js >= 16.x
- npm (v7 o superior)
- MongoDB (local o en la nube, como MongoDB Atlas)

### 1. **Clone the repository:**

```bash
git clone https://github.com/PoliGallego/Hubbies.git
```
### 2. Install dependencies

```bash
npm install
```

### 3. Configure the environment variables

Create an .env file in the project root with the following content:

```env
MONGO_URI=mongodb+srv://dbadmin:dbpassword@cluster0.itvrl4h.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0
PORT=3000
JWT_SECRET=secret=NV0B7dysi8KA6h9zNIhXUPuVNirIBRmhW57ykoqkfD0=
NODE_ENV=development
PORT2=8000
```
You can use MongoDB Atlas for remote connection.

### How to start the application
Under development
```bash
npm run dev
```
Use nodemon to automatically reload changes.


### Accessing the App
Once you have started, open your browser at:

``` plaintext
http://localhost:3000   
```

## Technologies ⚙️

The development of **Hubbies** uses modern technologies for scalability, responsiveness, and efficiency:

- **HTML5**: Used for structuring the content and building the foundation of the user interface.
- **CSS3**: Ensures a visually appealing, responsive design that adapts to all devices.
- **JavaScript**: Powers the client-side logic, providing dynamic interactivity for users.
- **MongoDB**: A NoSQL database used to store user data, hobby logs, and other dynamic content.
- **Visual Studio Code (IDE)**: Integrated development environment for writing, debugging, and managing code.
- **GitHub**: Version control and repository management to track code changes and collaborate with team members.

These technologies were chosen for their compatibility and ease of integration, ensuring a modern, flexible, and efficient web application.

## Useful Resources 📚

- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Visual Studio Code](https://code.visualstudio.com/)
- [CSS Tricks](https://css-tricks.com/)

## Authors ✨

- **Harold Hoyos Cano** – [GitHub](https://github.com/HaroldHoyos1722)
- **Juan Luis Gallego**  – [GitHub](https://github.com/PoliGallego)
- **Miguel Angel Calle** – [GitHub](https://github.com/MiguelAC3)
- **Juan Camilo Ortiz**  – [GitHub](https://github.com/svaltqt)


Feel free to contribute and report issues via our GitHub repository!

