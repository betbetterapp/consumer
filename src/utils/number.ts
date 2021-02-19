interface Number {
    prependZeroes(digits: number): string
}

Number.prototype.prependZeroes = function(digits: number) {
    const got = this == 0 ? 1 : Math.floor(Math.log10(this)) + 1
    return got < digits ? Array(digits - got).fill("0").join("") + this : this.toString()
}