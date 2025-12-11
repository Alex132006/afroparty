// Script pour les feux d'artifice
class Fireworks {
  constructor() {
    this.container = document.getElementById("fireworks-container");
    this.colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFFF00",
      "#FF00FF",
      "#00FFFF",
      "#FF4500",
      "#32CD32",
      "#1E90FF",
      "#FFD700",
      "#DA70D6",
      "#00CED1",
      "#1ac600",
      "#FF1493",
      "#00FF7F",
      "#4169E1",
      "#FF69B4",
      "#7CFC00",
    ];
    this.init();
  }

  init() {
    // Créer plusieurs feux d'artifice au démarrage
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.createFirework(), i * 1000);
    }

    // Continuer à créer des feux d'artifice
    setInterval(() => this.createFirework(), 1500);

    // Créer des feux d'artifice au clic
    document.addEventListener("click", (e) => {
      this.createFireworkAt(e.clientX, e.clientY);
    });
  }

  createFirework() {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight * 0.6);
    this.explode(x, y);
  }

  createFireworkAt(x, y) {
    this.explode(x, y);
  }

  explode(x, y) {
    const firework = document.createElement("div");
    firework.className = "firework";
    firework.style.left = x + "px";
    firework.style.top = y + "px";
    firework.style.backgroundColor =
      this.colors[Math.floor(Math.random() * this.colors.length)];

    this.container.appendChild(firework);

    // Animation du feu d'artifice
    firework.animate(
      [
        { transform: "scale(0.5)", opacity: 0 },
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(0.5)", opacity: 0 },
      ],
      {
        duration: 500,
        easing: "ease-out",
      }
    );

    // Créer les particules après l'explosion
    setTimeout(() => {
      this.createParticles(x, y);
      firework.remove();
    }, 500);
  }

  createParticles(x, y) {
    const particleCount = 30 + Math.floor(Math.random() * 20);
    const color = this.colors[Math.floor(Math.random() * this.colors.length)];

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = x + "px";
      particle.style.top = y + "px";
      particle.style.backgroundColor = color;

      this.container.appendChild(particle);

      // Direction et vitesse aléatoires
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const distance = 50 + Math.random() * 100;

      const xEnd = x + Math.cos(angle) * distance;
      const yEnd = y + Math.sin(angle) * distance;

      // Animation de la particule
      particle.animate(
        [
          {
            transform: "translate(0, 0) scale(1)",
            opacity: 1,
          },
          {
            transform: `translate(${Math.cos(angle) * distance}px, ${
              Math.sin(angle) * distance
            }px) scale(0.2)`,
            opacity: 0,
          },
        ],
        {
          duration: 800 + Math.random() * 700,
          easing: "cubic-bezier(0.1, 0.8, 0.2, 1)",
        }
      );

      // Supprimer la particule après l'animation
      setTimeout(() => {
        particle.remove();
      }, 1500);
    }
  }
}

// Démarrer les feux d'artifice lorsque la page est chargée
document.addEventListener("DOMContentLoaded", () => {
  new Fireworks();
});

// Ajouter des effets spéciaux au survol des boutons
document.querySelectorAll(".btn-infos, .icon").forEach((button) => {
  button.addEventListener("mouseenter", (e) => {
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Créer un petit feu d'artifice au survol
    if (window.fireworks) {
      window.fireworks.createFireworkAt(x, y);
    }
  });
});

// Exposer l'instance pour l'utiliser ailleurs
document.addEventListener("DOMContentLoaded", () => {
  window.fireworks = new Fireworks();
});
