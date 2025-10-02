class UserPrototype {
  constructor(
    fullName,
    username,
    birthDate,
    email,
    password,
    avatar,
    active = true
  ) {
    this.fullName = fullName;
    this.username = username;
    this.birthDate = birthDate;
    this.email = email;
    this.password = password;
    this.avatar = avatar || "avatar_icon.png";
    this.active = active;
  }

  clone() {
    return new UserPrototype(
      this.fullName,
      this.username,
      this.birthDate,
      this.email,
      this.password,
      this.avatar,
      this.active
    );
  }
}

module.exports = UserPrototype;
