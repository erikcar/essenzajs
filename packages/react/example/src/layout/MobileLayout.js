import { useApp } from "@essenza/react";
import { Outlet } from "react-router-dom";
import { Avatar, Col, Layout, Row, Tooltip } from "antd";
import React from 'react';
import { UserOutlined, HomeFilled } from '@ant-design/icons';

const { Header, Content } = Layout;

export function MobileLayout({ token }) {
  const app = useApp();
  return (
    <Layout className="bg-white">
      <Layout className="">
        <Header className="font-extrabold h-12">
          <Row>
            <Col flex="none">
              <HomeFilled onClick={() => app.navigate("/")} style={{ color: 'white', fontSize: '24px' }} />
            </Col>
            <Col flex="auto" >
              <Tooltip placement="bottom" title="Profilo" color="#264395">
                <Avatar className="cursor-pointer" onClick={() => app.navigate("/profile")} size={36} icon={<UserOutlined />} />
              </Tooltip>
            </Col>
          </Row>
        </Header>
        <Content
          className="container mx-auto px-2"
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