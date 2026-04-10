// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TipPost {
    struct Post {
        uint256 id;
        address creator;
        string imageUrl;
        string caption;
        uint256 likes;
        uint256 totalEarned;
        uint256 timestamp;
    }

    uint256 public postCount;
    uint256 public likeCost = 0.0001 ether;

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256) public totalEarnedByUser;

    event PostCreated(uint256 indexed id, address indexed creator, string imageUrl, string caption);
    event PostLiked(uint256 indexed id, address indexed liker);

    function createPost(string memory _imageUrl, string memory _caption) external {
        require(bytes(_imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(_caption).length > 0, "Caption cannot be empty");

        postCount++;
        posts[postCount] = Post(postCount, msg.sender, _imageUrl, _caption, 0, 0, block.timestamp);

        emit PostCreated(postCount, msg.sender, _imageUrl, _caption);
    }

    function likePost(uint256 _id) external payable {
        require(_id > 0 && _id <= postCount, "Post does not exist");
        require(msg.value == likeCost, "Incorrect tip amount");
        require(!hasLiked[_id][msg.sender], "Already liked this post");
        require(msg.sender != posts[_id].creator, "Cannot like your own post");

        hasLiked[_id][msg.sender] = true;
        posts[_id].likes++;
        posts[_id].totalEarned += msg.value;
        totalEarnedByUser[posts[_id].creator] += msg.value;

        (bool success,) = posts[_id].creator.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit PostLiked(_id, msg.sender);
    }

    function getAllPosts() external view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postCount);
        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i - 1] = posts[i];
        }
        return allPosts;
    }

    function checkLiked(uint256 _id, address _user) external view returns (bool) {
        return hasLiked[_id][_user];
    }
}