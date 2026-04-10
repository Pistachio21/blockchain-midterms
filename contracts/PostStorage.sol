// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PostStorage
 * @dev Smart contract for storing posts and accepting tips
 */
contract PostStorage is Ownable {
    struct Post {
        string content;
        address author;
        uint256 timestamp;
        uint256 tipAmount;
    }

    Post[] public posts;

    // Events
    event PostCreated(uint256 indexed postId, address indexed author, string content, uint256 timestamp);
    event PostTipped(uint256 indexed postId, address indexed tipper, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new post
     * @param _content The content of the post
     */
    function createPost(string memory _content) public {
        require(bytes(_content).length > 0, "Content cannot be empty");
        
        posts.push(Post({
            content: _content,
            author: msg.sender,
            timestamp: block.timestamp,
            tipAmount: 0
        }));

        emit PostCreated(posts.length - 1, msg.sender, _content, block.timestamp);
    }

    /**
     * @dev Tip a post author
     * @param _postId The ID of the post to tip
     */
    function tipPost(uint256 _postId) public payable {
        require(_postId < posts.length, "Post does not exist");
        require(msg.value > 0, "Tip amount must be greater than 0");

        address author = posts[_postId].author;
        require(author != address(0), "Author cannot be zero address");

        posts[_postId].tipAmount += msg.value;
        
        // Transfer ETH to the post author
        (bool success, ) = author.call{value: msg.value}("");
        require(success, "Transfer failed");

        emit PostTipped(_postId, msg.sender, msg.value);
    }

    /**
     * @dev Get the total number of posts
     * @return The number of posts
     */
    function getPostCount() public view returns (uint256) {
        return posts.length;
    }

    /**
     * @dev Get a specific post
     * @param _postId The ID of the post
     * @return The post struct
     */
    function getPost(uint256 _postId) public view returns (Post memory) {
        require(_postId < posts.length, "Post does not exist");
        return posts[_postId];
    }
}