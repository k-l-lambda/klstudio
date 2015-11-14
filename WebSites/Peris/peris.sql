-- phpMyAdmin SQL Dump
-- version 3.5.2.2
-- http://www.phpmyadmin.net
--
-- 主机: 127.0.0.1
-- 生成日期: 2015 年 11 月 14 日 04:33
-- 服务器版本: 5.5.27
-- PHP 版本: 5.4.7

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- 数据库: `peris`
--

-- --------------------------------------------------------

--
-- 表的结构 `album`
--

CREATE TABLE IF NOT EXISTS `album` (
  `hash` varchar(32) CHARACTER SET ascii NOT NULL,
  `score` decimal(8,5) DEFAULT NULL,
  `tags` text,
  PRIMARY KEY (`hash`),
  KEY `score` (`score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `cbir`
--

CREATE TABLE IF NOT EXISTS `cbir` (
  `hash` varchar(32) CHARACTER SET ascii NOT NULL,
  `thumb` varchar(16) CHARACTER SET ascii DEFAULT NULL,
  PRIMARY KEY (`hash`),
  KEY `thumb` (`thumb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- 表的结构 `file_register`
--

CREATE TABLE IF NOT EXISTS `file_register` (
  `path` varchar(200) NOT NULL,
  `hash` varchar(32) CHARACTER SET ascii NOT NULL,
  `date` datetime NOT NULL,
  `fingerprint` varchar(16) CHARACTER SET ascii DEFAULT NULL,
  PRIMARY KEY (`path`),
  KEY `date` (`date`),
  KEY `hash` (`hash`),
  KEY `fingerprint` (`fingerprint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
