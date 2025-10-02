class SectionPrototype {
    constructor(
        idUser,
        title,
        descrip,
        type,
        image,
        privacy,
        items,
        active = true
    ) {
        this.idUser = idUser;
        this.title = title;
        this.descrip = descrip;
        this.type = type;
        this.image = image || "section_icon.png";
        this.privacy = privacy;
        this.items = items || [];
        this.active = active;
    }

    clone() {
        return new SectionPrototype(
            this.idUser,
            this.title,
            this.descrip,
            this.type,
            this.image,
            this.privacy,
            this.items,
            this.active
        );
    }
}

module.exports = SectionPrototype;