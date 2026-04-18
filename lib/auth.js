import jwt from "jsonwebtoken";

export const signToken = (user) => {
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
}

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}