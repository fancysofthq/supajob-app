// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@nxsf/ipft/contracts/LibIPFT.sol";
import "@nxsf/ipft/contracts/IIPFT.sol";

contract JobBoard is
    ERC1155,
    IIPFT,
    Ownable,
    ERC1155Burnable,
    ERC1155Supply
{
    struct IPFTData {
        address author;
        bytes content;
        uint32 tagOffset;
        uint32 codec;
    }

    event MintFresh(
        uint256 indexed id,
        uint32 codec,
        address indexed author,
        uint256 value
    );

    event Mint(
        uint256 indexed id,
        uint256 value
    );

    event Promote(uint256 indexed id, uint256 value, bytes metadata);

    mapping (uint256 => address) _author;
    mapping (uint256 => uint32) _multicodec;

    uint256 public mintPrice;

    constructor(uint256 _mintPrice) ERC1155("") {
      mintPrice = _mintPrice;
    }

    function authorOf(uint256 tokenId) public view override(IIPFT) returns (address) {
        return _author[tokenId];
    }

    function multicodecOf(uint256 tokenId) public view override(IIPFT) returns (uint32) {
        return _multicodec[tokenId];
    }

    function multihashOf(uint256) public pure override(IIPFT) returns (uint32) {
        return 0x1b;
    }

    function digestSizeOf(uint256) public pure override(IIPFT) returns (uint32) {
        return 32;
    }

    function mintFresh(
        IPFTData calldata ipft,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public payable {
        _requireAuth(ipft.author);

        require(_author[id] == address(0), "JobBoard: already authored");
        require(amount > 0, "JobBoard: amount must be greater than 0");
        require(msg.value >= mintPrice * amount, "JobBoard: insufficient value");

        LibIPFT.verifyTag(
            ipft.content,
            ipft.tagOffset,
            address(this),
            ipft.author
        );

        // Check the content hash against the token ID.
        require(
            uint256(keccak256(ipft.content)) == id,
            "IPFT(721): content hash mismatch"
        );

        // Set token author.
        _author[id] = ipft.author;

        // Set token codec.
        _multicodec[id] = ipft.codec;

        // Mint the token.
        _mint(to, id, amount, data);
        emit MintFresh(id, ipft.codec, ipft.author, msg.value);
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) public payable {
        _requireAuth(_author[id]);

        require(amount > 0, "JobBoard: amount must be greater than 0");
        require(msg.value >= mintPrice * amount, "JobBoard: insufficient value");

        _mint(to, id, amount, data);
        emit Mint(id, msg.value);
    }

    function promote(
        uint256 id,
        bytes calldata metadata
    ) public payable {
        _requireAuth(_author[id]);
        require(msg.value >= 0, "JobBoard: zero value");
        emit Promote(id, msg.value, metadata);
    }

    /// Return {LibIPFT.uri} + "/metadata.json".
    function uri(
        uint256 id
    ) public view override(ERC1155) returns (string memory) {
        return string.concat(LibIPFT.uri(multicodecOf(id), multihashOf(id), digestSizeOf(id)), "/metadata.json");
    }

    /// @dev Set the mint price.
    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    /// @dev Withdraw all funds from the contract.
    function withdraw() public onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function _requireAuth(address author) internal view {
        require(
            msg.sender == author ||
            isApprovedForAll(author, msg.sender),
            "JobBoard: unauthorized"
        );
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        // If neither minting or burning, check that the token is not soulbound.
        if (from != address(0) && to != address(0)) {
            for (uint256 i = 0; i < ids.length; i++) {
                require(from == _author[ids[i]], "JobBoard: soulbound");
            }
        }

        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
