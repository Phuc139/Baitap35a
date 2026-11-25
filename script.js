const STORAGE_KEY = "registered_users_221A010581";

const form = document.getElementById("registerForm");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const agreeTermsInput = document.getElementById("agreeTerms");

const nameError = document.getElementById("nameError");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const termsError = document.getElementById("termsError");
const formMessage = document.getElementById("formMessage");

// Định dạng chuẩn hóa chuỗi cơ bản
function normalizeText(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
}

// Email cơ bản hợp lệ: có phần tên, @, domain và phần mở rộng >= 2 ký tự
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
}

// Mật khẩu tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường và 1 số
function isStrongPassword(password) {
    if (typeof password !== "string" || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpper && hasLower && hasNumber;
}

// Hash nhẹ phía client bằng SHA-256 (chỉ phục vụ demo cục bộ, không thay thế hash salt phía server)
async function hashPasswordDemo(password) {
    if (window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return "local_demo_record";
}

function setFieldError(inputEl, errorEl, message) {
    errorEl.textContent = message;
    if (inputEl && message) {
        inputEl.classList.add("input-error");
    } else if (inputEl) {
        inputEl.classList.remove("input-error");
    }
}

function clearAllErrors() {
    setFieldError(fullNameInput, nameError, "");
    setFieldError(emailInput, emailError, "");
    setFieldError(passwordInput, passwordError, "");
    setFieldError(agreeTermsInput, termsError, "");
    formMessage.textContent = "";
    formMessage.className = "form-message";
}

function validateForm() {
    clearAllErrors();
    let isValid = true;

    const cleanName = normalizeText(fullNameInput.value);
    const cleanEmail = normalizeText(emailInput.value).toLowerCase();
    const rawPassword = passwordInput.value;
    const isAgreed = agreeTermsInput.checked;

    if (!cleanName || cleanName.length < 2) {
        setFieldError(fullNameInput, nameError, "Vui lòng nhập họ và tên (ít nhất 2 ký tự).");
        isValid = false;
    }

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
        setFieldError(emailInput, emailError, "Vui lòng nhập địa chỉ email hợp lệ.");
        isValid = false;
    }

    if (!isStrongPassword(rawPassword)) {
        setFieldError(
            passwordInput,
            passwordError,
            "Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và chữ số."
        );
        isValid = false;
    }

    if (!isAgreed) {
        setFieldError(termsError ? null : agreeTermsInput, termsError, "Bạn cần đồng ý với điều khoản để đăng ký.");
        isValid = false;
    }

    return {
        isValid,
        data: { cleanName, cleanEmail, rawPassword }
    };
}

function readStoredUsers() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
}

async function saveUserToLocalStorage({ cleanName, cleanEmail, rawPassword }) {
    const users = readStoredUsers();
    const passwordDigest = await hashPasswordDemo(rawPassword);

    const newRecord = {
        name: cleanName,
        email: cleanEmail,
        passwordHash: passwordDigest, // Không lưu mật khẩu thuần (plain text)
        agreedTerms: true,
        createdAt: new Date().toISOString()
    };

    const existingIndex = users.findIndex((u) => u.email === cleanEmail);
    if (existingIndex >= 0) {
        users[existingIndex] = newRecord;
    } else {
        users.push(newRecord);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const { isValid, data } = validateForm();
    if (!isValid) {
        formMessage.textContent = "Vui lòng kiểm tra lại các trường thông tin chưa hợp lệ.";
        formMessage.className = "form-message msg-error";
        return;
    }

    try {
        await saveUserToLocalStorage(data);
        form.reset();
        clearAllErrors();
        formMessage.textContent = "Đăng ký thành công! Thông tin đã được lưu vào LocalStorage.";
        formMessage.className = "form-message msg-success";
    } catch (error) {
        formMessage.textContent = "Không thể lưu dữ liệu vào LocalStorage lúc này.";
        formMessage.className = "form-message msg-error";
    }
});
