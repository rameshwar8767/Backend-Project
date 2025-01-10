import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
const generateAccessTokenAndRefreshTokens = async (userId) => {
    try {
      // Retrieve the user from the database
      const user = await User.findById(userId);
  
      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        throw new ApiError(404, "User not found");
      }
  
      // Generate tokens
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
  
      // Save the refresh token to the database
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });
  
      return { accessToken, refreshToken };
    } catch (error) {
      console.error("Error in generateAccessTokenAndRefreshTokens:", error);
      throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
  };
  
  const registerUser = asyncHandler(async (req, res) => {
     // get user details from frontend
    //validation - non empty
    //check if user already exists : username  email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object -create entry in db
    //remove password and refreshtoken field from response
    //check for user creation
    //return res
    // get user details from frontend
    const { fullname, email, username, password } = req.body;
    console.log("Registration Request Data:", { email, username });
  
    if ([fullname, email, username, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }
  
    const existedUser = await User.findOne({
      $or: [{ username }, { email }]
    });
  
    if (existedUser) {
      console.error("User already exists with email or username:", { email, username });
      throw new ApiError(409, "User with email or username already exists");
    }
  
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0]?.path;
    }
  
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }
  
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
    });
  
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }
  
    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    );
  });
    

  const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    console.log("Login Request Data:", { email, username });
  
    if (!email && !username) {
      throw new ApiError(400, "Either username or email is required");
    }
  
    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email }]
    });
  
    if (!user) {
      console.error("User not found with provided credentials:", { email, username });
      throw new ApiError(400, "User does not exist");
    }
  
    // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      console.error("Incorrect password for user:", { username: user.username });
      throw new ApiError(401, "Please enter the correct password");
    }
  
    try {
      // Generate tokens
      const { accessToken, refreshToken } = await generateAccessTokenAndRefreshTokens(user._id);
  
      // Fetch the user data without sensitive fields
      const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
      };
  
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully"
          )
        );
    } catch (error) {
      console.error("Error during login:", error);
      throw new ApiError(500, "Failed to log in user");
    }
  });
  
  const logoutUser = asyncHandler(async (req, res) => {
    try {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: { refreshToken: undefined }
        },
        { new: true }
      );
  
      const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Strict"
      };
  
      return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
    } catch (error) {
      console.error("Error during logout:", error);
      throw new ApiError(500, "Failed to log out user");
    }
  });

  const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
  })
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    )
    const user = awaitUser.findById(decodedToken?._id)
    
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used")
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const {accessToken, newrefreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newrefreshToken},
        "Access token refreshed successfully"
      )
    )
  
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }
export {registerUser, loginUser, logoutUser, refreshAccessToken}