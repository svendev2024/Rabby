import React from 'react';
import { Input, Form, Upload, Button } from 'antd';
import { StrayPageWithButton } from 'ui/component';
import { useWallet } from 'ui/utils';

const ImportJson = () => {
  const [form] = Form.useForm();
  const wallet = useWallet();

  const onSubmit = async ({ keyStore, password }) => {
    await wallet.importJson(keyStore, password);
  };

  return (
    <StrayPageWithButton
      header={{
        title: 'Import Private Key',
        subTitle: 'Please input your private key below',
      }}
      onSubmit={onSubmit}
      form={form}
    >
      <Form.Item name="keyStore" valuePropName="file">
        <Upload
          beforeUpload={(file) => {
            const reader = new FileReader();

            reader.onload = (e) => {
              form.setFieldsValue({ keyStore: e.target?.result });
            };
            reader.readAsText(file);

            // Prevent upload
            return false;
          }}
        >
          <Button>Select a JSON file</Button>
        </Upload>
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Please input your password' }]}
      >
        <Input placeholder="Password" />
      </Form.Item>
    </StrayPageWithButton>
  );
};

export default ImportJson;