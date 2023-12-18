//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let sortType = "date";
let keywords = "";
let loginMessage = "";
let Email = "";
let EmailError = "";
let passwordError = "";
let currentETag = "";
let currentViewName = "photosList";
let delayTimeOut = 200; // seconds
let queryString = ""

// pour la pagination
let photoContainerWidth = 400;
let photoContainerHeight = 400;
let limit;
let HorizontalPhotosCount;
let VerticalPhotosCount;
let offset = 0;

Init_UI();
function Init_UI() {
    getViewPortPhotosRanges();
    initTimeout(delayTimeOut, renderExpiredSession);
    installWindowResizeHandler();
    if (API.retrieveLoggedUser())
        renderPhotos();
    else
        renderLoginForm();
}

// pour la pagination
function getViewPortPhotosRanges() {
    // estimate the value of limit according to height of content
    VerticalPhotosCount = Math.round($("#content").innerHeight() / photoContainerHeight);
    HorizontalPhotosCount = Math.round($("#content").innerWidth() / photoContainerWidth);
    limit = (VerticalPhotosCount + 1) * HorizontalPhotosCount;
    console.log("VerticalPhotosCount:", VerticalPhotosCount, "HorizontalPhotosCount:", HorizontalPhotosCount)
    offset = 0;
}
// pour la pagination
function installWindowResizeHandler() {
    var resizeTimer = null;
    var resizeEndTriggerDelai = 250;
    $(window).on('resize', function (e) {
        if (!resizeTimer) {
            $(window).trigger('resizestart');
        }
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            resizeTimer = null;
            $(window).trigger('resizeend');
        }, resizeEndTriggerDelai);
    }).on('resizestart', function () {
        console.log('resize start');
    }).on('resizeend', function () {
        console.log('resize end');
        if ($('#photosLayout') != null) {
            getViewPortPhotosRanges();
            if (currentViewName == "photosList")
                renderPhotosList();
        }
    });
}
function attachCmd() {
    $('#loginCmd').on('click', renderLoginForm);
    $('#logoutCmd').on('click', logout);
    $('#listPhotosCmd').on('click', renderPhotos);
    $('#listPhotosMenuCmd').on('click', () => {
        queryString = "";
        refreshHeader();
        renderPhotos();
    });
    $('#editProfilMenuCmd').on('click', renderEditProfilForm);
    $('#renderManageUsersMenuCmd').on('click', renderManageUsers);
    $('#editProfilCmd').on('click', renderEditProfilForm);
    $('#aboutCmd').on("click", renderAbout);
    $('#newPhotoCmd').on("click", renderAddPhoto);
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Header management
function loggedUserMenu() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let manageUserMenu = `
            <span class="dropdown-item" id="renderManageUsersMenuCmd">
                <i class="menuIcon fas fa-user-cog mx-2"></i> Gestion des usagers
            </span>
            <div class="dropdown-divider"></div>
        `;
        return `
            ${loggedUser.isAdmin ? manageUserMenu : ""}
            <span class="dropdown-item" id="logoutCmd">
                <i class="menuIcon fa fa-sign-out mx-2"></i> Déconnexion
            </span>
            <span class="dropdown-item" id="editProfilMenuCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modifier votre profil
            </span>
            <div class="dropdown-divider"></div>
            <span class="dropdown-item" id="listPhotosMenuCmd">
                <i class="menuIcon fa fa-image mx-2"></i> Liste des photos
            </span>
        `;
    }
    else
        return `
            <span class="dropdown-item" id="loginCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </span>`;
}
function viewMenu(viewName) {
    if (viewName == "photosList") {
        return `
        <div class="dropdown-divider"></div>
        <span class="dropdown-item" id="sortByDateCmd">
                <i class="menuIcon fa fa-${queryString == "?sort=Date" ? `check` : "fw"} mx-2"></i>
                <i class="menuIcon fa fa-calendar mx-2"></i> Photos par date de création
            </span>
            <span class="dropdown-item" id="sortByOwnersCmd">
                <i class="menuIcon fa fa-${queryString == "?sort=OwnerId" ? `check` : "fw"} mx-2"></i>
                <i class="menuIcon fa fa-users mx-2"></i> Photos par créateur
            </span>
            <span class="dropdown-item" id="sortByLikesCmd">
                <i class="menuIcon fa fa-${queryString == "?sort=Likes,desc" ? `check` : "fw"} mx-2"></i>
                <i class="menuIcon fa fa-heart mx-2"></i> Photos les plus aiméés
            </span>
            <span class="dropdown-item" id="ownerOnlyCmd">
                <i class="menuIcon fa fa-${queryString.includes("?OwnerId=") ? `check` : "fw"} mx-2"></i>
                <i class="menuIcon fa fa-user mx-2"></i> Mes photos
            </span>`;
    }
    else
        return "";
}
function connectedUserAvatar() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        return `
            <div class="UserAvatarSmall" userId="${loggedUser.Id}" id="editProfilCmd" style="background-image:url('${loggedUser.Avatar}')" title="${loggedUser.Name}"></div>
        `;
    return "";
}
function refreshHeader() {
    UpdateHeader(currentViewTitle, currentViewName);
}
function UpdateHeader(viewTitle, viewName) {
    currentViewTitle = viewTitle;
    currentViewName = viewName;
    $("#header").empty();
    $("#header").append(`
        <span title="Liste des photos" id="listPhotosCmd"><img src="images/PhotoCloudLogo.png" class="appLogo"></span>
        <span class="viewTitle">${viewTitle} 
            <div class="cmdIcon fa fa-plus" id="newPhotoCmd" title="Ajouter une photo"></div>
        </span>

        <div class="headerMenusContainer">
            <span>&nbsp</span> <!--filler-->
            <i title="Modifier votre profil"> ${connectedUserAvatar()} </i>         
            <div class="dropdown ms-auto dropdownLayout">
                <div data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="cmdIcon fa fa-ellipsis-vertical"></i>
                </div>
                <div class="dropdown-menu noselect">
                    ${loggedUserMenu()}
                    ${viewMenu(viewName)}
                    <div class="dropdown-divider"></div>
                    <span class="dropdown-item" id="aboutCmd">
                        <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
                    </span>
                </div>
            </div>

        </div>
    `);
    if (viewName == "photosList") {
        $('#sortByDateCmd').on('click', () => applyFilter("Date"));
        $('#sortByOwnersCmd').on('click', () => applyFilter("OwnerId", "users"));
        $('#sortByLikesCmd').on('click', () => applyFilter("Likes,desc", "like"));
        $('#ownerOnlyCmd').on('click', () => applyFilter(null, "owner", `OwnerId=${API.retrieveLoggedUser().Id}`));
    }
    if (sortType == "keywords" && viewName == "photosList") {
        $("#customHeader").show();
        $("#customHeader").empty();
        $("#customHeader").append(`
            <div class="searchContainer">
                <input type="search" class="form-control" placeholder="Recherche par mots-clés" id="keywords" value="${keywords}"/>
                <i class="cmdIcon fa fa-search" id="setSearchKeywordsCmd"></i>
            </div>
        `);
    } else {
        $("#customHeader").hide();
    }
    attachCmd();
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Actions and command
async function login(credential) {
    console.log("login");
    loginMessage = "";
    EmailError = "";
    passwordError = "";
    Email = credential.Email;
    await API.login(credential.Email, credential.Password);
    if (API.error) {
        switch (API.currentStatus) {
            case 482: passwordError = "Mot de passe incorrect"; renderLoginForm(); break;
            case 481: EmailError = "Courriel introuvable"; renderLoginForm(); break;
            default: renderError("Le serveur ne répond pas"); break;
        }
    } else {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser.VerifyCode == 'verified') {
            if (!loggedUser.isBlocked)
                renderPhotos();
            else {
                loginMessage = "Votre compte a été bloqué par l'administrateur";
                logout();
            }
        }
        else
            renderVerify();
    }
}
async function logout() {
    console.log('logout');
    await API.logout();
    renderLoginForm();
}
function isVerified() {
    let loggedUser = API.retrieveLoggedUser();
    return loggedUser.VerifyCode == "verified";
}
function applyFilter(query, sort, otherQuery) {
    if (query) {
        queryString = `?sort=${query}`;
    } else {
        queryString = `?${otherQuery}`;
    }
    sortType = sort;
    refreshHeader();
    renderPhotosList();
}
async function verify(verifyCode) {
    let loggedUser = API.retrieveLoggedUser();
    if (await API.verifyEmail(loggedUser.Id, verifyCode)) {
        renderPhotos();
    } else {
        renderError("Désolé, votre code de vérification n'est pas valide...");
    }
}
async function editProfil(profil) {
    if (await API.modifyUserProfil(profil)) {
        let loggedUser = API.retrieveLoggedUser();
        if (loggedUser) {
            if (isVerified()) {
                renderPhotos();
            } else
                renderVerify();
        } else
            renderLoginForm();

    } else {
        renderError("Un problème est survenu.");
    }
}
async function createProfil(profil) {
    if (await API.register(profil)) {
        loginMessage = "Votre compte a été créé. Veuillez prendre vos courriels pour réccupérer votre code de vérification qui vous sera demandé lors de votre prochaine connexion."
        renderLoginForm();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function adminDeleteAccount(userId) {
    if (await API.unsubscribeAccount(userId)) {
        renderManageUsers();
    } else {
        renderError("Un problème est survenu.");
    }
}
async function deleteProfil() {
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        if (await API.unsubscribeAccount(loggedUser.Id)) {
            loginMessage = "Votre compte a été effacé.";
            logout();
        } else
            renderError("Un problème est survenu.");
    }
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/// Views rendering
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='images/Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
async function renderError(message) {
    noTimeout();
    switch (API.currentStatus) {
        case 401:
        case 403:
        case 405:
            message = "Accès refusé...Expiration de votre session. Veuillez vous reconnecter.";
            await API.logout();
            renderLoginForm();
            break;
        case 404: message = "Ressource introuvable..."; break;
        case 409: message = "Ressource conflictuelle..."; break;
        default: if (!message) message = "Un problème est survenu...";
    }
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("Problème", "error");
    $("#newPhotoCmd").hide();
    $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="form">
                <button id="connectCmd" class="form-control btn-primary">Connexion</button>
            </div>
        `)
    );
    $('#connectCmd').on('click', renderLoginForm);
    /* pour debug
    $("#content").append(
        $(`
            <div class="errorContainer">
                <b>${message}</b>
            </div>
            <hr>
            <div class="systemErrorContainer">
                <b>Message du serveur</b> : <br>
                ${API.currentHttpError} <br>

                <b>Status Http</b> :
                ${API.currentStatus}
            </div>
        `)
    ); */
}
function renderAbout() {
    timeout();
    saveContentScrollPosition();
    eraseContent();
    UpdateHeader("À propos...", "about");
    $("#newPhotoCmd").hide();
    $("#createContact").hide();
    $("#abort").show();
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de photos</h2>
                <hr>
                <p>
                    Petite application de gestion de photos multiusagers à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Jean-Sébastien Labrie
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2023
                </p>
            </div>
        `))
}
async function renderPhotos() {
    timeout();
    showWaitingGif();
    UpdateHeader('Liste des photos', 'photosList')
    $("#newPhotoCmd").show();
    $("#abort").hide();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser)
        renderPhotosList();
    else {
        renderLoginForm();
    }
}
async function renderPhotosList() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        // queryString = "?sort=Date,Desc";
        API.GetPhotos(queryString).then(r => {
            if (r) {
                $("#content").append(`<div class="photosLayout"></div>`);
                for (const photo of r.data) {
                    if (photo.Shared || photo.Owner.Id == loggedUser.Id || loggedUser.isAdmin) {
                        $(".photosLayout").append(`
                        <div class="photoLayoutNoScrollSnap" id="${photo.Id}">
                            <div class="photoTitleContainer">
                                <span class="photoTitle">${photo.Title}</span>
                            </div>
                                <div class="photoImage" style="background-image:url(${photo.Image.split("assetsRepository/")[1] != "" ? photo.Image : "images/PhotoCloudLogo.png"});">
                                <div class="UserAvatarSmall" style="background-image:url(${photo.Owner.Avatar});"></div>
                                ${photo.Shared && photo.Owner.Id == loggedUser.Id ? `<div class="UserAvatarSmall shared" style="background-image:url('images/shared.png');"></div>` : ''}
                            </div>
                            <div class="photoCreationDate">
                                ${formaterDate(photo.Date)}
                                <div class="likesSummary">
                                    <span>3</span>
                                    <i class="fa-regular fa-thumbs-up fa-lg"></i>
                                </div>
                            </div>
                        </div>`
                        );
                        if (photo.OwnerId == loggedUser.Id || loggedUser.isAdmin) {
                            $(`#${photo.Id} .photoTitleContainer`).append(`
                            <i class="fa-solid fa-pencil photoTitle" id="editCmd"></i>
                            <i class="fa-solid fa-trash photoTitle" id="deleteCmd"></i>`
                            );
                            $(`#${photo.Id} #editCmd`).on('click', () => renderEditPhoto(photo));
                            $(`#${photo.Id} #deleteCmd`).on('click', () => renderDeletePhoto(photo));
                        }
                        $(`#${photo.Id} span.photoTitle, #${photo.Id} .photoImage`).on('click', () => renderDetailPhoto(photo));
                    }
                }
            } else {
                renderError("Une erreur est survenue");
            }
        });
    }
}
function renderDetailPhoto(photo) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Détails", "DetailsPhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(`
        <div class="photoDetailsOwner">
            <div class="UserAvatarSmall" style="background-image:url(${photo.Owner.Avatar});"></div>
            <div>${photo.Owner.Name}</div>
        </div>
        <hr>
        <div class="photoDetailsTitle">${photo.Title}</div>
        <br>
        <div class="photoDetailsLargeImage" style="background-image:url(${photo.Image.split("assetsRepository/")[1] != "" ? photo.Image : "images/PhotoCloudLogo.png"});"></div>
        <div class="photoDetailsCreationDate">
            ${formaterDate(photo.Date)}
            <div class="likesSummary">
                <span>3</span>
                <i class="fa-regular fa-thumbs-up fa-lg"></i>
            </div>
        </div>
        `);
    }
}
function renderEditPhoto(photo) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Modification de photo", "EditPhoto");
        $("#newPhotoCmd").hide();
        $('#content').append(`
        <form class="form" id="editPhotoForm">
            <fieldset>
                <legend>Informations</legend>
                <input type="hidden" name="Id" value="${photo.Id}"/>
                <input type="text"
                       class="form-control"
                       name="Title"
                       id="Title"
                       placeholder="Titre"
                       required
                       RequireMessage = 'Veuillez entrer un titre'
                       InvalidMessage = 'titre invalide'
                       value="${photo.Title}"/>
                <textarea class="form-control" rows="4" name="Description" id="Description" placeholder="Description" required RequireMessage='Veuillez entrez une nouveau description'>${photo.Description}</textarea>
                <input type="checkbox"
                       name="Shared"
                       id="Shared"
                       ${photo.Shared ? 'checked' : ''}/>
                <label for="Shared">Partagée</label>
            </fieldset>
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader'
                     newImage='true'
                     controlId='Image'
                     imageSrc='${photo.Image.split("assetsRepository/")[1] != "" ? photo.Image : "images/PhotoCloudLogo.png"}'
                     waitingImage="images/Loading_icon.gif">
                </div>
            </fieldset>
            <input type='submit' name='submit' id='saveImageCmd' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
        `);
        initFormValidation();
        initImageUploaders();
        $("#abortCmd").on('click', renderPhotos);
        $("#editPhotoForm").on('submit', function (e) {
            let data = getFormData($('#editPhotoForm'));
            data["Shared"] = $("#Shared").prop("checked");
            data['OwnerId'] = photo.Owner.Id;
            e.preventDefault();
            showWaitingGif();
            if (photo.Owner.Id == loggedUser.Id || loggedUser.isAdmin) {
                API.UpdatePhoto(data).then(r => {
                    if (r) {
                        renderPhotos();
                    } else {
                        renderError("Un problème est survenu.");
                    }
                });
            } else {
                renderError("Cette photo ne vous appartient pas.");
            }
        });
    }
}
function renderDeletePhoto(photo) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Retrait de photo", "DeletePhoto");
        $("#newPhotoCmd").hide();
        $("#content").append(`
        <div class="content loginForm">
            <br>
            <div class="form UserRow">
                <h4> Voulez-vous vraiment effacer cet photo? </h4>
                <div class="photoTitleContainer">
                    <span class="photoTitle">${photo.Title}</span>
                </div>
                <div class="photoImage" style="background-image:url(${photo.Image.split("assetsRepository/")[1] != "" ? photo.Image : "images/PhotoCloudLogo.png"});"></div>       
            </div>
            <div class="form">
                <button class="form-control btn-danger" id="deletePhotoCmd">Effacer la photo</button>
                <br>
                <button class="form-control btn-secondary" id="abortDeletePhotoCmd">Annuler</button>
            </div>  
        </div>`
        );
        $("#deletePhotoCmd").on("click", () => {
            deletePhoto(photo, loggedUser);
        });
        $("#abortDeletePhotoCmd").on("click", renderPhotos);
    }
}
function formaterDate(timestamp) {
    const date = new Date(timestamp * 1000);

    return `${new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date).slice(1)} le ${date.getDate()} ${new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date)} ${date.getFullYear()} @ ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}:${('0' + date.getSeconds()).slice(-2)}`;
}
function deletePhoto(photo, user) {
    if (photo.Owner.Id == user.Id || loggedUser.isAdmin) {
        API.DeletePhoto(photo.Id).then(r => {
            if (r) {
                renderPhotos();
            } else {
                renderError("Un problème est survenu.");
            }
        });
    } else {
        renderError("Cette photo ne vous appartient pas.");
    }
}
function renderVerify() {
    eraseContent();
    UpdateHeader("Vérification", "verify");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content">
            <form class="form" id="verifyForm">
                <b>Veuillez entrer le code de vérification de que vous avez reçu par courriel</b>
                <input  type='text' 
                        name='Code'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer le code que vous avez reçu par courriel'
                        InvalidMessage = 'Courriel invalide';
                        placeholder="Code de vérification de courriel" > 
                <input type='submit' name='submit' value="Vérifier" class="form-control btn-primary">
            </form>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#verifyForm').on("submit", function (event) {
        let verifyForm = getFormData($('#verifyForm'));
        event.preventDefault();
        showWaitingGif();
        verify(verifyForm.Code);
    });
}
function renderCreateProfil() {
    noTimeout();
    eraseContent();
    UpdateHeader("Inscription", "createProfil");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <br/>
        <form class="form" id="createProfilForm"'>
            <fieldset>
                <legend>Adresse de courriel</legend>
                <input  type="email" 
                        class="form-control Email" 
                        name="Email" 
                        id="Email"
                        placeholder="Courriel" 
                        required 
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        CustomErrorMessage ="Ce courriel est déjà utilisé"/>

                <input  class="form-control MatchedInput" 
                        type="text" 
                        matchedInputId="Email"
                        name="matchedEmail" 
                        id="matchedEmail" 
                        placeholder="Vérification" 
                        required
                        RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                        InvalidMessage="Les courriels ne correspondent pas" />
            </fieldset>
            <fieldset>
                <legend>Mot de passe</legend>
                <input  type="password" 
                        class="form-control" 
                        name="Password" 
                        id="Password"
                        placeholder="Mot de passe" 
                        required 
                        RequireMessage = 'Veuillez entrer un mot de passe'
                        InvalidMessage = 'Mot de passe trop court'/>

                <input  class="form-control MatchedInput" 
                        type="password" 
                        matchedInputId="Password"
                        name="matchedPassword" 
                        id="matchedPassword" 
                        placeholder="Vérification" required
                        InvalidMessage="Ne correspond pas au mot de passe" />
            </fieldset>
            <fieldset>
                <legend>Nom</legend>
                <input  type="text" 
                        class="form-control Alpha" 
                        name="Name" 
                        id="Name"
                        placeholder="Nom" 
                        required 
                        RequireMessage = 'Veuillez entrer votre nom'
                        InvalidMessage = 'Nom invalide'/>
            </fieldset>
            <fieldset>
                <legend>Avatar</legend>
                <div class='imageUploader' 
                        newImage='true' 
                        controlId='Avatar' 
                        imageSrc='images/no-avatar.png' 
                        waitingImage="images/Loading_icon.gif">
            </div>
            </fieldset>
   
            <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCreateProfilCmd">Annuler</button>
        </div>
    `);
    $('#loginCmd').on('click', renderLoginForm);
    initFormValidation(); // important do to after all html injection!
    initImageUploaders();
    $('#abortCreateProfilCmd').on('click', renderLoginForm);
    addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
    $('#createProfilForm').on("submit", function (event) {
        let profil = getFormData($('#createProfilForm'));
        delete profil.matchedPassword;
        delete profil.matchedEmail;
        event.preventDefault();
        showWaitingGif();
        createProfil(profil);
    });
}
async function renderManageUsers() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser.isAdmin) {
        if (isVerified()) {
            showWaitingGif();
            UpdateHeader('Gestion des usagers', 'manageUsers')
            $("#newPhotoCmd").hide();
            $("#abort").hide();
            let users = await API.GetAccounts();
            if (API.error) {
                renderError();
            } else {
                $("#content").empty();
                users.data.forEach(user => {
                    if (user.Id != loggedUser.Id) {
                        let typeIcon = user.Authorizations.readAccess == 2 ? "fas fa-user-cog" : "fas fa-user-alt";
                        typeTitle = user.Authorizations.readAccess == 2 ? "Retirer le droit administrateur à" : "Octroyer le droit administrateur à";
                        let blockedClass = user.Authorizations.readAccess == -1 ? "class=' blockUserCmd cmdIconVisible fa fa-ban redCmd'" : "class='blockUserCmd cmdIconVisible fa-regular fa-circle greenCmd'";
                        let blockedTitle = user.Authorizations.readAccess == -1 ? `Débloquer ${user.Name}` : `Bloquer ${user.Name}`;
                        let userRow = `
                        <div class="UserRow"">
                            <div class="UserContainer noselect">
                                <div class="UserLayout">
                                    <div class="UserAvatar" style="background-image:url('${user.Avatar}')"></div>
                                    <div class="UserInfo">
                                        <span class="UserName">${user.Name}</span>
                                        <a href="mailto:${user.Email}" class="UserEmail" target="_blank" >${user.Email}</a>
                                    </div>
                                </div>
                                <div class="UserCommandPanel">
                                    <span class="promoteUserCmd cmdIconVisible ${typeIcon} dodgerblueCmd" title="${typeTitle} ${user.Name}" userId="${user.Id}"></span>
                                    <span ${blockedClass} title="${blockedTitle}" userId="${user.Id}" ></span>
                                    <span class="removeUserCmd cmdIconVisible fas fa-user-slash goldenrodCmd" title="Effacer ${user.Name}" userId="${user.Id}"></span>
                                </div>
                            </div>
                        </div>           
                        `;
                        $("#content").append(userRow);
                    }
                });
                $(".promoteUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.PromoteUser(userId);
                    renderManageUsers();
                });
                $(".blockUserCmd").on("click", async function () {
                    let userId = $(this).attr("userId");
                    await API.BlockUser(userId);
                    renderManageUsers();
                });
                $(".removeUserCmd").on("click", function () {
                    let userId = $(this).attr("userId");
                    renderConfirmDeleteAccount(userId);
                });
            }
        } else
            renderVerify();
    } else
        renderLoginForm();
}
async function renderConfirmDeleteAccount(userId) {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        let userToDelete = (await API.GetAccount(userId)).data;
        if (!API.error) {
            eraseContent();
            UpdateHeader("Retrait de compte", "confirmDeleteAccoun");
            $("#newPhotoCmd").hide();
            $("#content").append(`
                <div class="content loginForm">
                    <br>
                    <div class="form UserRow ">
                        <h4> Voulez-vous vraiment effacer cet usager et toutes ses photos? </h4>
                        <div class="UserContainer noselect">
                            <div class="UserLayout">
                                <div class="UserAvatar" style="background-image:url('${userToDelete.Avatar}')"></div>
                                <div class="UserInfo">
                                    <span class="UserName">${userToDelete.Name}</span>
                                    <a href="mailto:${userToDelete.Email}" class="UserEmail" target="_blank" >${userToDelete.Email}</a>
                                </div>
                            </div>
                        </div>
                    </div>           
                    <div class="form">
                        <button class="form-control btn-danger" id="deleteAccountCmd">Effacer</button>
                        <br>
                        <button class="form-control btn-secondary" id="abortDeleteAccountCmd">Annuler</button>
                    </div>
                </div>
            `);
            $("#deleteAccountCmd").on("click", function () {
                adminDeleteAccount(userToDelete.Id);
            });
            $("#abortDeleteAccountCmd").on("click", renderManageUsers);
        } else {
            renderError("Une erreur est survenue");
        }
    }
}
function renderEditProfilForm() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Profil", "editProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <br/>
            <form class="form" id="editProfilForm"'>
                <input type="hidden" name="Id" id="Id" value="${loggedUser.Id}"/>
                <fieldset>
                    <legend>Adresse de courriel</legend>
                    <input  type="email" 
                            class="form-control Email" 
                            name="Email" 
                            id="Email"
                            placeholder="Courriel" 
                            required 
                            RequireMessage = 'Veuillez entrer votre courriel'
                            InvalidMessage = 'Courriel invalide'
                            CustomErrorMessage ="Ce courriel est déjà utilisé"
                            value="${loggedUser.Email}" >

                    <input  class="form-control MatchedInput" 
                            type="text" 
                            matchedInputId="Email"
                            name="matchedEmail" 
                            id="matchedEmail" 
                            placeholder="Vérification" 
                            required
                            RequireMessage = 'Veuillez entrez de nouveau votre courriel'
                            InvalidMessage="Les courriels ne correspondent pas" 
                            value="${loggedUser.Email}" >
                </fieldset>
                <fieldset>
                    <legend>Mot de passe</legend>
                    <input  type="password" 
                            class="form-control" 
                            name="Password" 
                            id="Password"
                            placeholder="Mot de passe" 
                            InvalidMessage = 'Mot de passe trop court' >

                    <input  class="form-control MatchedInput" 
                            type="password" 
                            matchedInputId="Password"
                            name="matchedPassword" 
                            id="matchedPassword" 
                            placeholder="Vérification" 
                            InvalidMessage="Ne correspond pas au mot de passe" >
                </fieldset>
                <fieldset>
                    <legend>Nom</legend>
                    <input  type="text" 
                            class="form-control Alpha" 
                            name="Name" 
                            id="Name"
                            placeholder="Nom" 
                            required 
                            RequireMessage = 'Veuillez entrer votre nom'
                            InvalidMessage = 'Nom invalide'
                            value="${loggedUser.Name}" >
                </fieldset>
                <fieldset>
                    <legend>Avatar</legend>
                    <div class='imageUploader' 
                            newImage='false' 
                            controlId='Avatar' 
                            imageSrc='${loggedUser.Avatar}' 
                            waitingImage="images/Loading_icon.gif">
                </div>
                </fieldset>

                <input type='submit' name='submit' id='saveUser' value="Enregistrer" class="form-control btn-primary">
                
            </form>
            <div class="cancel">
                <button class="form-control btn-secondary" id="abortEditProfilCmd">Annuler</button>
            </div>

            <div class="cancel">
                <hr>
                <button class="form-control btn-warning" id="confirmDelelteProfilCMD">Effacer le compte</button>
            </div>
        `);
        initFormValidation(); // important do to after all html injection!
        initImageUploaders();
        addConflictValidation(API.checkConflictURL(), 'Email', 'saveUser');
        $('#abortEditProfilCmd').on('click', renderPhotos);
        $('#confirmDelelteProfilCMD').on('click', renderConfirmDeleteProfil);
        $('#editProfilForm').on("submit", function (event) {
            let profil = getFormData($('#editProfilForm'));
            delete profil.matchedPassword;
            delete profil.matchedEmail;
            event.preventDefault();
            showWaitingGif();
            editProfil(profil);
        });
    }
}
function renderConfirmDeleteProfil() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Retrait de compte", "confirmDeleteProfil");
        $("#newPhotoCmd").hide();
        $("#content").append(`
            <div class="content loginForm">
                <br>
                <div class="form">
                 <h3> Voulez-vous vraiment effacer votre compte? </h3>
                    <button class="form-control btn-danger" id="deleteProfilCmd">Effacer mon compte</button>
                    <br>
                    <button class="form-control btn-secondary" id="cancelDeleteProfilCmd">Annuler</button>
                </div>
            </div>
        `);
        $("#deleteProfilCmd").on("click", deleteProfil);
        $('#cancelDeleteProfilCmd').on('click', renderEditProfilForm);
    }
}
function renderExpiredSession() {
    noTimeout();
    loginMessage = "Votre session est expirée. Veuillez vous reconnecter.";
    logout();
    renderLoginForm();
}
function renderLoginForm() {
    noTimeout();
    eraseContent();
    UpdateHeader("Connexion", "Login");
    $("#newPhotoCmd").hide();
    $("#content").append(`
        <div class="content" style="text-align:center">
            <div class="loginMessage">${loginMessage}</div>
            <form class="form" id="loginForm">
                <input  type='email' 
                        name='Email'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre courriel'
                        InvalidMessage = 'Courriel invalide'
                        placeholder="adresse de courriel"
                        value='${Email}'> 
                <span style='color:red'>${EmailError}</span>
                <input  type='password' 
                        name='Password' 
                        placeholder='Mot de passe'
                        class="form-control"
                        required
                        RequireMessage = 'Veuillez entrer votre mot de passe'
                        InvalidMessage = 'Mot de passe trop court' >
                <span style='color:red'>${passwordError}</span>
                <input type='submit' name='submit' value="Entrer" class="form-control btn-primary">
            </form>
            <div class="form">
                <hr>
                <button class="form-control btn-info" id="createProfilCmd">Nouveau compte</button>
            </div>
        </div>
    `);
    initFormValidation(); // important do to after all html injection!
    $('#createProfilCmd').on('click', renderCreateProfil);
    $('#loginForm').on("submit", function (event) {
        let credential = getFormData($('#loginForm'));
        event.preventDefault();
        showWaitingGif();
        login(credential);
    });
}
async function renderAddPhoto() {
    timeout();
    let loggedUser = API.retrieveLoggedUser();
    if (loggedUser) {
        eraseContent();
        UpdateHeader("Ajout de photos", "addPhoto");
        $("#newPhotoCmd").hide();
        $('#content').append(`
        <form class="form" id="addPhotoForm">
            <fieldset>
                <legend>Informations</legend>
                <input type="text"
                       class="form-control"
                       name="Title"
                       id="Title"
                       placeholder="Titre"
                       required
                       RequireMessage = 'Veuillez entrer un titre'
                       InvalidMessage = 'titre invalide'/>
                <textarea class="form-control" rows="4" name="Description" id="Description" placeholder="Description" required RequireMessage='Veuillez entrez une nouveau description'></textarea>
                <input type="checkbox"
                       name="Shared"
                       id="Shared"/>
                <label for="Shared">Partagée</label>
            </fieldset>
            <fieldset>
                <legend>Image</legend>
                <div class='imageUploader'
                     newImage='true'
                     controlId='Image'
                     imageSrc='images/PhotoCloudLogo.png'
                     waitingImage="images/Loading_icon.gif">
                </div>
            </fieldset>
            <input type='submit' name='submit' id='saveImageCmd' value="Enregistrer" class="form-control btn-primary">
        </form>
        <div class="cancel">
            <button class="form-control btn-secondary" id="abortCmd">Annuler</button>
        </div>
        `);
        initFormValidation();
        initImageUploaders();
        $("#abortCmd").on('click', renderPhotos);
        $("#addPhotoForm").on('submit', function (e) {
            let data = getFormData($('#addPhotoForm'));
            data["Shared"] = $("#Shared").prop("checked");
            data['OwnerId'] = API.retrieveLoggedUser().Id;

            e.preventDefault();
            showWaitingGif();
            API.CreatePhoto(data).then(r => {
                if (r) {
                    renderPhotos();
                } else {
                    renderError("Un problème est survenu.");
                }
            });
        });
    }
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}