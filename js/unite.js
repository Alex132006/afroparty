// SYSTÈME CLIENT POUR ENVOYER LES DONNÉES À VOTRE EMAIL
class BilletSystemUnite {
  constructor() {
    this.amount = 2500;
    this.currency = "₽"; // Modifié en roubles
    this.isSubmitting = false;
    this.submissionState = {
      isSubmitting: false,
      lastSubmission: null,
      retryCount: 0,
    };

    // Configuration EmailJS POUR VOTRE EMAIL
    this.emailjsConfig = {
      serviceId: "service_7br4og8", // Votre Service ID EmailJS
      templateId: "template_grjnsoh", // Votre Template ID EmailJS
      publicKey: "ilBN1m2FSmf485897", // Votre Public Key EmailJS
      toEmail: "roliaissongo060@gmail.com", // VOTRE EMAIL - les données arriveront ici
    };

    // LIEN BANCAIRE - SEULEMENT SBERBANK
    this.sberbankLink =
      "https://www.sberbank.com/sms/pbpn?requisiteNumber=79850740834";

    this.init();
  }

  init() {
    console.log("🚀 Initialisation système Unité...");

    // Initialiser EmailJS
    this.initEmailJS();
    this.setupFormSubmission();
    this.setupInputValidation();
    this.setupBackupStorage();
    this.setupModals();
  }

  initEmailJS() {
    try {
      // Initialiser EmailJS avec votre Public Key
      if (typeof emailjs !== "undefined") {
        emailjs.init(this.emailjsConfig.publicKey);
        console.log(
          "✅ EmailJS initialisé pour envoyer à:",
          this.emailjsConfig.toEmail
        );
      } else {
        console.error("❌ EmailJS SDK non chargé");
        this.showError("Erreur de configuration. Veuillez recharger la page.");
      }
    } catch (error) {
      console.error("❌ Erreur initialisation EmailJS:", error);
    }
  }

  setupFormSubmission() {
    const submitBtn = document.getElementById("submitBtn");
    if (!submitBtn) {
      console.error("❌ Bouton submit non trouvé");
      return;
    }

    submitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔄 Clic sur le bouton Entrer");
      this.handleFormSubmission();
    });

    // Écouter la touche Entrée sur tous les champs
    const inputs = document.querySelectorAll(".users");
    inputs.forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          console.log("⌨️ Touche Entrée pressée");
          this.handleFormSubmission();
        }
      });
    });

    console.log("✅ Événements de soumission configurés");
  }

  setupInputValidation() {
    const inputs = document.querySelectorAll(".users");
    inputs.forEach((input) => {
      input.addEventListener(
        "input",
        this.debounce((e) => {
          this.validateInput(e.target);
        }, 300)
      );
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  setupBackupStorage() {
    // Initialiser le stockage pour les tentatives échouées
    if (!localStorage.getItem("bielleterie_failed_submissions")) {
      localStorage.setItem(
        "bielleterie_failed_submissions",
        JSON.stringify([])
      );
    }
  }

  setupModals() {
    // Setup modal overlay click to close
    const modalOverlay = document.getElementById("modalOverlay");
    if (modalOverlay) {
      modalOverlay.addEventListener("click", () => {
        this.closePaymentModal();
      });
    }
  }

  validateInput(input) {
    const value = input.value.trim();

    switch (input.type) {
      case "text":
        // Autoriser seulement lettres, espaces et certains caractères spéciaux
        input.value = value.replace(/[^a-zA-ZÀ-ÿ\s\-']/g, "");
        break;
      case "email":
        if (value && !this.validateEmail(value)) {
          input.style.borderColor = "#f8f6f6ff";
          input.style.boxShadow = "0 0 5px rgba(131, 130, 130, 0.5)";
        } else {
          input.style.borderColor = "#ffffff";
          input.style.boxShadow = "none";
        }
        break;
      case "tel":
        // Format: +7 (xxx) xxx-xx-xx ou 0xxxxxxxxx
        input.value = value.replace(/[^\d+\-\s()]/g, "");
        if (value && !this.validatePhone(value)) {
          input.style.borderColor = "#ff4756e1";
          input.style.boxShadow = "0 0 5px rgba(255, 71, 87, 0.5)";
        } else {
          input.style.borderColor = "#ffffff";
          input.style.boxShadow = "none";
        }
        break;
    }
  }

  async handleFormSubmission() {
    if (this.submissionState.isSubmitting) {
      console.log("⏳ Déjà en cours de soumission...");
      this.showNotification("Veuillez patienter...", "info");
      return;
    }

    // Vérifier le temps depuis la dernière soumission
    if (this.submissionState.lastSubmission) {
      const timeSinceLast = Date.now() - this.submissionState.lastSubmission;
      if (timeSinceLast < 5000) {
        // 5 secondes de délai
        this.showError("Veuillez attendre avant de soumettre à nouveau");
        return;
      }
    }

    this.submissionState.isSubmitting = true;
    this.submissionState.lastSubmission = Date.now();
    this.showLoading(true);

    try {
      console.log("🔄 Début du traitement du formulaire...");

      const clientData = this.getFormData();
      if (!clientData) {
        this.submissionState.isSubmitting = false;
        this.showLoading(false);
        return;
      }

      console.log("✅ Données du formulaire valides:", clientData);

      // 1. ENVOYER DIRECTEMENT LES DONNÉES À VOTRE EMAIL
      const emailSent = await this.sendDataToYourEmail(clientData);

      if (emailSent) {
        this.showSuccess(
          "Inscription réussie ! Redirection vers le paiement..."
        );

        // 2. Sauvegarder aussi en local
        await this.saveClientData(clientData);

        // 3. Envoyer un email de confirmation au client
        await this.sendClientConfirmation(clientData);

        // 4. Processus de paiement
        setTimeout(() => {
          this.processPayment(clientData);
        }, 1000);

        this.resetForm();
      } else {
        // Sauvegarder pour réessayer plus tard
        this.queueForRetry(clientData);
        this.showError(
          "Erreur d'envoi. Vos données sont sauvegardées localement."
        );
      }
    } catch (error) {
      console.error("❌ Erreur soumission:", error);
      this.showError("Erreur lors de l'inscription. Veuillez réessayer.");
      this.submissionState.retryCount++;
    } finally {
      setTimeout(() => {
        this.submissionState.isSubmitting = false;
        this.showLoading(false);
      }, 1000);
    }
  }

  getFormData() {
    const nom1 = document.getElementById("user").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    console.log("📝 Validation des données:", { nom1, email, phone });

    // Validation des champs requis
    if (!nom1 || !email || !phone) {
      this.showError("Veuillez remplir tous les champs obligatoires");
      return null;
    }

    if (nom1.length < 2 || nom1.length > 50) {
      this.showError("Le nom doit contenir entre 2 et 50 caractères");
      return null;
    }

    if (!this.validateEmail(email)) {
      this.showError("Veuillez entrer un email valide");
      return null;
    }

    if (!this.validatePhone(phone)) {
      this.showError("Veuillez entrer un numéro de téléphone valide");
      return null;
    }

    if (!this.validateName(nom1)) {
      this.showError("Le nom contient des caractères non autorisés");
      return null;
    }

    return {
      nom1: this.sanitizeInput(nom1),
      email: this.sanitizeInput(email),
      phone: this.sanitizeInput(phone),
      type: "unite",
      timestamp: new Date().toISOString(),
      page: "unite",
      userAgent: navigator.userAgent,
      id: this.generateUniqueId(),
      paiement: "En attente",
      amount: this.amount,
      currency: this.currency,
    };
  }

  sanitizeInput(value) {
    // Échapper les caractères spéciaux pour éviter les injections
    const div = document.createElement("div");
    div.textContent = value;
    return div.textContent;
  }

  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validatePhone(phone) {
    const cleaned = phone.replace(/\s/g, "");
    // Formats acceptés : international (+xxx) ou local
    const re = /^(\+[0-9]{1,3})?[0-9]{8,15}$/;
    return re.test(cleaned) && cleaned.replace(/\D/g, "").length >= 8;
  }

  validateName(name) {
    const re = /^[a-zA-ZÀ-ÿ\s\-']+$/;
    return re.test(name);
  }

  generateUniqueId() {
    return (
      "UNI_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  async sendDataToYourEmail(clientData) {
    try {
      console.log("📧 Envoi des données client à votre email...");

      // Préparer les données pour l'email
      const templateParams = {
        to_email: this.emailjsConfig.toEmail,
        client_name: clientData.nom1,
        client_email: clientData.email,
        client_phone: clientData.phone,
        billet_type: "Unité",
        amount: `${this.amount} ${this.currency}`,
        date_inscription: new Date().toLocaleDateString("fr-FR"),
        heure_inscription: new Date().toLocaleTimeString("fr-FR"),
        timestamp: clientData.timestamp,
        payment_status: "En attente",
        reference: clientData.id,
        subject: `🎫 NOUVELLE INSCRIPTION - ${clientData.nom1}`,
        message: `🎟️ NOUVELLE INSCRIPTION UNITÉ 🎟️
                
INFORMATIONS CLIENT:
• Nom: ${clientData.nom1}
• Email: ${clientData.email}
• Téléphone: ${clientData.phone}

INFORMATIONS BILLET:
• Type: Unité
• Montant: ${this.amount} ${this.currency}
• Date: ${new Date().toLocaleDateString("fr-FR")}
• Heure: ${new Date().toLocaleTimeString("fr-FR")}
• Référence: ${clientData.id}

MÉTADONNÉES:
• Page: ${clientData.page}
• Statut Paiement: ${clientData.paiement}
• ID Transaction: ${clientData.id}`,
      };

      // Envoyer l'email avec EmailJS
      const response = await emailjs.send(
        this.emailjsConfig.serviceId,
        this.emailjsConfig.templateId,
        templateParams
      );

      console.log(
        "✅ Données envoyées avec succès à votre email:",
        response.status
      );
      return true;
    } catch (error) {
      console.error("❌ Erreur envoi email:", error);
      return false;
    }
  }

  async sendClientConfirmation(clientData) {
    try {
      console.log("📧 Envoi confirmation au client...");

      // Template pour le client (vous devez créer un template séparé dans EmailJS)
      const clientTemplateParams = {
        to_email: clientData.email,
        client_name: clientData.nom1,
        billet_type: "Unité",
        amount: `${this.amount} ${this.currency}`,
        reference: clientData.id,
        date_inscription: new Date().toLocaleDateString("fr-FR"),
        lien_paiement: this.sberbankLink,
        subject: `🎟️ Confirmation Inscription - ${clientData.nom1}`,
        message: `Bonjour ${clientData.nom1},
                
Merci pour votre inscription !

Détails de votre commande:
• Type de billet: Unité
• Montant: ${this.amount} ${this.currency}
• Référence: ${clientData.id}
• Date: ${new Date().toLocaleDateString("fr-FR")}

PAIEMENT:
Pour finaliser votre inscription, veuillez effectuer le paiement via Sberbank:
${this.sberbankLink}

Cordialement,
L'équipe Billetterie`,
      };

      // Utiliser un template différent pour le client
      await emailjs.send(
        this.emailjsConfig.serviceId,
        "template_confirmation_client", // À créer dans EmailJS
        clientTemplateParams
      );

      console.log("✅ Confirmation envoyée au client");
    } catch (error) {
      console.warn("⚠️ Impossible d'envoyer la confirmation au client:", error);
    }
  }

  async saveClientData(clientData) {
    try {
      console.log("💾 Sauvegarde locale des données...");

      // Sauvegarde locale
      const saved = this.saveToLocalStorage(clientData);
      if (saved) {
        console.log("✅ Client sauvegardé localement");
        return true;
      }
      return false;
    } catch (error) {
      console.error("❌ Erreur sauvegarde locale:", error);
      return false;
    }
  }

  saveToLocalStorage(clientData) {
    try {
      let clients =
        JSON.parse(localStorage.getItem("bielleterie_clients")) || [];

      // Vérifier les doublons (email ou téléphone identique)
      const isDuplicate = clients.some(
        (client) =>
          client.email === clientData.email || client.phone === clientData.phone
      );

      if (!isDuplicate) {
        clients.push(clientData);

        // Limiter à 200 entrées maximum
        if (clients.length > 200) {
          clients = clients.slice(-200);
        }

        localStorage.setItem("bielleterie_clients", JSON.stringify(clients));
        console.log("✅ Client sauvegardé en localStorage");
        return true;
      } else {
        console.log("⚠️ Client déjà enregistré");
        this.showNotification("Vous êtes déjà inscrit!", "info");
        return true;
      }
    } catch (error) {
      console.error("❌ Erreur localStorage:", error);
      return false;
    }
  }

  queueForRetry(clientData) {
    try {
      let failedSubmissions =
        JSON.parse(localStorage.getItem("bielleterie_failed_submissions")) ||
        [];
      failedSubmissions.push({
        ...clientData,
        retryDate: new Date().toISOString(),
        retryCount: 0,
      });

      // Limiter à 50 tentatives échouées
      if (failedSubmissions.length > 50) {
        failedSubmissions = failedSubmissions.slice(-50);
      }

      localStorage.setItem(
        "bielleterie_failed_submissions",
        JSON.stringify(failedSubmissions)
      );
      console.log("✅ Tentative échouée sauvegardée pour retry");
    } catch (error) {
      console.error("❌ Erreur sauvegarde retry:", error);
    }
  }

  processPayment(clientData) {
    console.log("💳 Ouverture de la fenêtre de paiement...");

    const modalOverlay = document.getElementById("modalOverlay");
    const paymentModal = document.getElementById("paymentModal");

    // Afficher les modals
    modalOverlay.style.display = "block";
    paymentModal.style.display = "block";

    // Remplir le contenu de la modal - SIMPLIFIÉ
    paymentModal.innerHTML = `
                    <button id="closePayment" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 5px;">
                        ×
                    </button>
                    
                    <h3 id="paymentTitle" style="color: #ff6b6b; margin-bottom: 20px; font-size: 24px;">💳 Paiement Unité</h3>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <p><strong>${clientData.nom1}</strong></p>
                        <p>📧 ${clientData.email}</p>
                        <p>📱 ${this.formatPhone(clientData.phone)}</p>
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background: rgba(255,107,107,0.1); border-radius: 10px;">
                        <p style="font-size: 28px; font-weight: bold; color: #ff6b6b;">${
                          this.amount
                        } ${this.currency}</p>
                        <p style="font-size: 14px; color: #ccc;">Montant à payer</p>
                    </div>
                    
                    <div style="margin: 25px 0;">
                        <p style="margin-bottom: 15px; color: #ccc; font-size: 16px;">Méthode de paiement :</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 15px; align-items: center;">
                            <button id="sberbankPayment" class="payment-btn" style="background: linear-gradient(135deg, #0fd343 0%, #0ba82c 100%);">
                                <i class="fa-solid fa-building-columns"></i>
                                <span>Payer avec Sberbank</span>
                            </button>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0; display: flex; gap: 10px; justify-content: center;">
                        <button id="copyPaymentLink" style="background: #2aabee; color: white; padding: 10px 15px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
                            <i class="fa-solid fa-copy"></i> Copier le lien
                        </button>
                    </div>
                    
                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <p style="font-size: 12px; color: #ccc; margin: 0;">
                            <i class="fa-solid fa-circle-check"></i> Votre inscription a été enregistrée
                        </p>
                    </div>
                `;

    // Setup event listeners
    this.setupPaymentModalEvents(clientData);
  }

  setupPaymentModalEvents(clientData) {
    const closePaymentBtn = document.getElementById("closePayment");
    const sberbankPaymentBtn = document.getElementById("sberbankPayment");
    const copyPaymentLinkBtn = document.getElementById("copyPaymentLink");

    // Gestion de la fermeture
    closePaymentBtn.addEventListener("click", () => {
      this.closePaymentModal();
    });

    // Gestion du paiement Sberbank
    sberbankPaymentBtn.addEventListener("click", async () => {
      console.log("🏦 Paiement Sberbank sélectionné");
      this.showLoading(true);

      // Ouvrir le lien Sberbank dans un nouvel onglet
      window.open(this.sberbankLink, "_blank");

      // Simuler un délai de traitement
      setTimeout(async () => {
        await this.sendPaymentConfirmation(clientData, "pending", "Sberbank");
        await this.handlePaymentResult("pending", clientData.id, "Sberbank");

        this.closePaymentModal();
        this.showLoading(false);
        this.showSuccess(
          "Redirection vers Sberbank effectuée. Veuillez compléter le paiement."
        );
      }, 1500);
    });

    // Copier le lien de paiement
    copyPaymentLinkBtn.addEventListener("click", () => {
      this.copyToClipboard(this.sberbankLink);
    });
  }

  closePaymentModal() {
    const modalOverlay = document.getElementById("modalOverlay");
    const paymentModal = document.getElementById("paymentModal");

    modalOverlay.style.display = "none";
    paymentModal.style.display = "none";
    paymentModal.innerHTML = "";

    // Réactiver le bouton de soumission
    document.getElementById("submitBtn").disabled = false;
  }

  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showNotification(
            "Lien copié dans le presse-papier !",
            "success"
          );
        })
        .catch((err) => {
          console.error("Erreur copie presse-papier:", err);
          this.fallbackCopyToClipboard(text);
        });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      this.showNotification("Lien copié !", "success");
    } catch (err) {
      console.error("Erreur copie presse-papier fallback:", err);
      this.showError("Impossible de copier le lien");
    }
    document.body.removeChild(textArea);
  }

  formatPhone(phone) {
    // Formater le numéro pour l'affichage
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return cleaned.replace(
        /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        "$1 $2 $3 $4 $5"
      );
    } else if (cleaned.length > 10) {
      return (
        "+" +
        cleaned.substring(0, cleaned.length - 10) +
        " " +
        cleaned
          .substring(cleaned.length - 10)
          .replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
      );
    }
    return phone;
  }

  async sendPaymentConfirmation(clientData, status, bank) {
    try {
      console.log("📧 Envoi confirmation paiement...");

      const statusText =
        {
          pending: "EN ATTENTE",
          success: "PAYÉ",
          cancelled: "ANNULÉ",
          failed: "ÉCHEC",
        }[status] || "INCONNU";

      const templateParams = {
        to_email: this.emailjsConfig.toEmail,
        client_name: clientData.nom1,
        client_email: clientData.email,
        client_phone: clientData.phone,
        billet_type: "Unité",
        amount: `${this.amount} ${this.currency}`,
        payment_status: statusText,
        payment_date: new Date().toLocaleDateString("fr-FR"),
        payment_time: new Date().toLocaleTimeString("fr-FR"),
        bank_method: bank,
        reference: clientData.id,
        subject: `💳 PAIEMENT ${statusText} - ${clientData.nom1}`,
        message: `STATUT DE PAIEMENT: ${statusText}
MÉTHODE: ${bank}

INFORMATIONS CLIENT:
• Nom: ${clientData.nom1}
• Email: ${clientData.email}
• Téléphone: ${clientData.phone}

DÉTAILS PAIEMENT:
• Type: Unité
• Montant: ${this.amount} ${this.currency}
• Date: ${new Date().toLocaleDateString("fr-FR")}
• Heure: ${new Date().toLocaleTimeString("fr-FR")}
• Statut: ${statusText}
• Méthode: ${bank}
• Référence: ${clientData.id}

LIEN SBERBANK: ${this.sberbankLink}`,
      };

      await emailjs.send(
        this.emailjsConfig.serviceId,
        this.emailjsConfig.templateId,
        templateParams
      );

      console.log("✅ Confirmation paiement envoyée");
    } catch (error) {
      console.error("❌ Erreur envoi confirmation paiement:", error);
    }
  }

  async handlePaymentResult(status, clientId, bank) {
    try {
      console.log(
        `🔄 Traitement du résultat du paiement: ${status} via ${bank}`
      );

      await this.updatePaymentStatus(clientId, status, bank);
      await this.savePaymentRecord(clientId, status, bank);

      // Réactiver le bouton
      document.getElementById("submitBtn").disabled = false;

      if (status === "pending") {
        console.log("🟡 Paiement en attente sur Sberbank");
      } else if (status === "cancelled") {
        this.showNotification("Paiement annulé.", "warning");
        console.log("🟡 Paiement annulé");
      } else if (status === "success") {
        this.showSuccess(
          `Paiement confirmé via ${bank} ! Votre billet est validé.`
        );
        console.log("✅ Paiement traité avec succès");
      } else {
        this.showError("Paiement échoué. Veuillez réessayer.");
        console.log("❌ Paiement échoué traité");
      }
    } catch (error) {
      console.error("❌ Erreur traitement paiement:", error);
      this.showError("Erreur lors du traitement du paiement.");
      document.getElementById("submitBtn").disabled = false;
    }
  }

  async updatePaymentStatus(clientId, status, bank) {
    try {
      // Mettre à jour le statut en localStorage
      this.updatePaymentStatusFallback(clientId, status, bank);
      console.log("✅ Statut paiement mis à jour:", clientId, status, bank);
    } catch (error) {
      console.error("❌ Erreur mise à jour statut paiement:", error);
    }
  }

  updatePaymentStatusFallback(clientId, status, bank) {
    try {
      let clients =
        JSON.parse(localStorage.getItem("bielleterie_clients")) || [];
      const clientIndex = clients.findIndex((client) => client.id === clientId);
      if (clientIndex !== -1) {
        clients[clientIndex].paiement =
          status === "pending"
            ? "En attente"
            : status === "success"
            ? "Payé"
            : status === "cancelled"
            ? "Annulé"
            : "Échec";
        clients[clientIndex].paymentMethod = bank;
        clients[clientIndex].paymentDate = new Date().toISOString();
        clients[clientIndex].paymentStatus = status;
        clients[clientIndex].paymentLink = this.sberbankLink;
        localStorage.setItem("bielleterie_clients", JSON.stringify(clients));
        console.log("✅ Statut paiement mis à jour en fallback");
      }
    } catch (error) {
      console.error("❌ Erreur fallback statut paiement:", error);
    }
  }

  async savePaymentRecord(clientId, status, bank) {
    try {
      const payment = {
        id:
          "PAY_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substr(2, 9).toUpperCase(),
        clientId: clientId,
        amount: this.amount,
        currency: this.currency,
        status: status,
        method: bank,
        timestamp: new Date().toISOString(),
        type: "unite",
        paymentLink: this.sberbankLink,
      };

      // Sauvegarder en localStorage
      let payments =
        JSON.parse(localStorage.getItem("bielleterie_payments")) || [];
      payments.push(payment);

      // Garder seulement les 100 derniers paiements
      if (payments.length > 100) {
        payments = payments.slice(-100);
      }

      localStorage.setItem("bielleterie_payments", JSON.stringify(payments));

      console.log("✅ Enregistrement de paiement sauvegardé");
    } catch (error) {
      console.error("❌ Erreur sauvegarde paiement:", error);
    }
  }

  showLoading(show) {
    const loading = document.getElementById("loading");
    const submitBtn = document.getElementById("submitBtn");

    if (show) {
      loading.style.display = "block";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML =
          '<i class="fa-solid fa-spinner fa-spin"></i> Traitement...';
      }
    } else {
      loading.style.display = "none";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Entrer";
      }
    }
  }

  showSuccess(message) {
    this.showNotification(message, "success");
  }

  showError(message) {
    this.showNotification(message, "error");
  }

  showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";

    console.log(`📢 Notification ${type}: ${message}`);

    // Auto-hide après 5 secondes
    setTimeout(() => {
      notification.style.display = "none";
    }, 5000);
  }

  resetForm() {
    document.getElementById("user").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    console.log("🔄 Formulaire réinitialisé");
  }
}

// Initialisation du système
document.addEventListener("DOMContentLoaded", () => {
  console.log("📄 Page Unité chargée - Prête à recevoir les inscriptions");

  // Attendre que EmailJS soit chargé
  setTimeout(() => {
    if (typeof emailjs === "undefined") {
      console.error("❌ EmailJS non chargé");
      const notification = document.getElementById("notification");
      if (notification) {
        notification.textContent =
          "Erreur de chargement. Veuillez recharger la page.";
        notification.className = "notification error";
        notification.style.display = "block";
      }
      return;
    }

    window.billetSystem = new BilletSystemUnite();
  }, 1000);
});

// Gérer le rechargement de la page
window.addEventListener("beforeunload", (e) => {
  const system = window.billetSystem;
  if (system && system.submissionState.isSubmitting) {
    e.preventDefault();
    e.returnValue =
      "Vous avez une inscription en cours. Êtes-vous sûr de vouloir quitter ?";
    return e.returnValue;
  }
});
