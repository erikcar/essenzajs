import { useApp } from "@essenza/react";
import { Outlet } from "react-router-dom";
import { Avatar, Col, Layout, Row, Tooltip } from "antd";
import React from 'react';
import { UserOutlined, HomeFilled, SettingOutlined } from '@ant-design/icons';
import { Logo } from "./logo";

const { Header, Content } = Layout;

export function MainLayout({ token }) {
  const app = useApp();
  return (
    <Layout className="bg-white">
      <Layout className="">
        <Header className="font-extrabold h-12">
          <Row>
            <Col flex="none">
              <Logo style={{ height: "36px" }} />
            </Col>
            <Col flex="auto">

            </Col>
            <Col flex="none">
              <HomeFilled onClick={() => app.navigate("/home")} style={{ color: 'white', fontSize: '24px' }} />
            </Col>
            <Col flex="auto">

            </Col>
            <Col flex="60px" >
              <Tooltip placement="bottom" title="Impostazioni" color="#2db7f5">
                <SettingOutlined style={{ color: 'white', fontSize: '32px', verticalAlign: 'middle' }} className="cursor-pointer" onClick={() => app.navigate("/settings")} />
              </Tooltip>
            </Col>
            <Col flex="none">
              <Tooltip placement="bottom" title="Profilo" color="#264395">
                <Avatar className="cursor-pointer" onClick={() => app.navigate("/profile")} size={36} icon={<UserOutlined />} />
              </Tooltip>
            </Col>
          </Row>
        </Header>
        <Content
          className="container mx-auto px-4"
          style={{
            padding: 0,
            minHeight: 280,
          }}
        >
          <Outlet></Outlet>
        </Content>
      </Layout>
    </Layout>
  );
}